import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Sequelize } from 'sequelize-typescript';
import { TokenType } from 'src/core/shared-kernel/secondary-adapters/token/data/token-type.enum';
import {
  TokenServiceInterface,
  TokenServiceInterfaceType,
} from 'src/core/shared-kernel/ports/token-service.interface';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import { LoginRequest } from '../data/request/login.request';
import { LoginResponse } from '../data/response/login.response';
import VerifyUserPasswordUseCase from './password/verify-user-password.usecase';
import { User } from 'src/core/components/user/application/data/user.dto';
import { GetUserAuthByEmailQuery } from 'src/core/components/user/application/query-handler/get-user-auth-by-email/get-user-auth-by-email.query';
import { UserAuth } from 'src/core/components/user/application/data/user-auth.dto';
import { GetUserByIdQuery } from 'src/core/components/user/application/query-handler/get-user-by-id/get-user-by-id.query';
import { UpdateUserAuthCommand } from 'src/core/components/user/application/command-handler/update-user-auth/update-user-auth.command';
import { mockData } from 'src/core/shared-kernel/data/constants/mock-data.constant';

@Injectable()
export default class LoginUseCase
  implements UseCase<LoginRequest, LoginResponse>
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly verifyUserPasswordUseCase: VerifyUserPasswordUseCase,
    @Inject(TokenServiceInterfaceType)
    private readonly tokenService: TokenServiceInterface,
    private readonly sequelize: Sequelize,
  ) {}

  public async execute(loginDto: LoginRequest): Promise<LoginResponse> {
    const lowercaseEmail = loginDto.email.toLowerCase();

    const userAuth: UserAuth = await this.queryBus.execute(
      new GetUserAuthByEmailQuery(lowercaseEmail),
    );

    if (!userAuth) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await this.verifyUserPasswordUseCase.execute({
      password: loginDto.password,
      userPassword: userAuth.password,
    });

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user: User = await this.queryBus.execute(
      new GetUserByIdQuery(userAuth.user_id),
    );

    const tokenPayload: object = {
      id: user.id,
      username: user.username,
      email: lowercaseEmail,
      description: user.description,
      avatar: user.avatar || mockData.avatar,
    };

    const token = this.tokenService.generateToken({
      payload: tokenPayload,
      type: TokenType.accessToken,
    });

    const refreshToken = this.tokenService.generateToken({
      payload: tokenPayload,
      type: TokenType.refreshToken,
    });

    const t = await this.sequelize.transaction();

    try {
      await this.commandBus.execute(
        new UpdateUserAuthCommand(
          userAuth.user_id,
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
      id: user.id,
      username: user.username,
      description: user.description,
      avatar: user.avatar || mockData.avatar,
      email: lowercaseEmail,
      type: user.type,
      is_verified: user.is_verified,
      token,
      refresh_token: refreshToken,
      created_at: user.created_at,
      deleted_at: user.deleted_at,
    };
  }
}
