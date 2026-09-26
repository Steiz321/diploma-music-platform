import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Sequelize } from 'sequelize-typescript';
import GetEncryptedPasswordUseCase from './password/get-encrypted-password.usecase';
import { GetUserAuthByEmailQuery } from 'src/core/components/user/application/query-handler/get-user-auth-by-email/get-user-auth-by-email.query';
import { GetUserByUsernameQuery } from 'src/core/components/user/application/query-handler/get-user-by-username/get-user-by-username.query';
import { User } from 'src/core/components/user/application/data/user.dto';
import { CreateUserWithCredsCommand } from 'src/core/components/user/application/command-handler/create-user-with-creds/create-user-with-creds.command';
import {
  TokenServiceInterface,
  TokenServiceInterfaceType,
} from 'src/core/shared-kernel/ports/token-service.interface';
import { TokenType } from 'src/core/shared-kernel/secondary-adapters/token/data/token-type.enum';
import { UpdateUserAuthCommand } from 'src/core/components/user/application/command-handler/update-user-auth/update-user-auth.command';
import { RegisterResponse } from '../data/response/register.response';
import { mockData } from 'src/core/shared-kernel/data/constants/mock-data.constant';
import {
  S3ServiceInterface,
  S3ServiceInterfaceType,
} from 'src/core/shared-kernel/ports/s3-service.interface';
import { FileObjectName } from 'src/core/shared-kernel/secondary-adapters/s3/data/enum/file-object-name.enum';

interface RegisterArguments {
  username: string;
  email: string;
  password: string;
  description?: string;
  avatar?: Express.Multer.File;
}

@Injectable()
export default class RegisterUseCase
  implements UseCase<RegisterArguments, RegisterResponse>
{
  constructor(
    @Inject(TokenServiceInterfaceType)
    private readonly tokenService: TokenServiceInterface,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly getEncryptedPasswordUseCase: GetEncryptedPasswordUseCase,
    private readonly sequelize: Sequelize,
    @Inject(S3ServiceInterfaceType)
    private readonly s3Service: S3ServiceInterface,
  ) {}

  public async execute({
    email,
    username,
    password,
    description,
    avatar,
  }: RegisterArguments): Promise<RegisterResponse> {
    const lowercaseEmail = email.toLowerCase();

    const [foundUserByEmail, foundUserByUsername] = await Promise.all([
      this.queryBus.execute(new GetUserAuthByEmailQuery(lowercaseEmail)),
      this.queryBus.execute(new GetUserByUsernameQuery(username)),
    ]);

    if (foundUserByEmail) {
      throw new BadRequestException('User with this email is already exists');
    }

    if (foundUserByUsername) {
      throw new BadRequestException(
        'User with this username is already exists',
      );
    }

    const encryptedPassword =
      await this.getEncryptedPasswordUseCase.execute(password);

    const t = await this.sequelize.transaction();
    let newUser: User;

    let token: string;
    let refreshToken: string;

    try {
      let avatarUrl = mockData.avatar;

      if (avatar) {
        const formattedCoverFileName = this.s3Service.formatFileName(
          avatar.originalname,
          FileObjectName.avatar,
        );

        avatarUrl = (
          await this.s3Service.uploadFile(avatar, formattedCoverFileName, [
            FileObjectName.avatar,
          ])
        ).url;
      }

      newUser = await this.commandBus.execute(
        new CreateUserWithCredsCommand(
          {
            username,
            email: lowercaseEmail,
            password: encryptedPassword,
            description: description || null,
            avatar: avatarUrl,
          },
          t,
        ),
      );

      const tokenPayload: object = {
        id: newUser.id,
        username: username,
        email: lowercaseEmail,
        description: description || null,
        avatar: avatarUrl,
      };

      token = this.tokenService.generateToken({
        payload: tokenPayload,
        type: TokenType.accessToken,
      });

      refreshToken = this.tokenService.generateToken({
        payload: tokenPayload,
        type: TokenType.refreshToken,
      });

      await this.commandBus.execute(
        new UpdateUserAuthCommand(
          newUser.id,
          {
            token,
            refresh_token: refreshToken,
          },
          t,
        ),
      );

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    return {
      id: newUser.id,
      username: newUser.username,
      description: newUser.description,
      avatar: newUser.avatar,
      email: lowercaseEmail,
      type: newUser.type,
      is_verified: newUser.is_verified,
      token,
      refresh_token: refreshToken,
      created_at: newUser.created_at,
      deleted_at: newUser.deleted_at,
    };
  }
}
