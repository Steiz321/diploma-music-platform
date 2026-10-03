import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserWithCredsCommand } from './create-user-with-creds.command';
import {
  UserRepository,
  UserRepositoryType,
} from 'src/core/components/user/ports/user.repository';
import {
  UserAuthRepository,
  UserAuthRepositoryType,
} from 'src/core/components/user/ports/user-auth.repository';
import { User } from '../../data/user.dto';
import { Inject } from '@nestjs/common';
import { UserType } from 'src/core/shared-kernel/data/enum/user-type.enum';

@CommandHandler(CreateUserWithCredsCommand)
export class CreateUserWithCredsCommandHandler
  implements ICommandHandler<CreateUserWithCredsCommand, User>
{
  constructor(
    @Inject(UserRepositoryType) private readonly userRepository: UserRepository,
    @Inject(UserAuthRepositoryType)
    private readonly userAuthRepository: UserAuthRepository,
  ) {}

  public async execute({
    user,
    transaction,
  }: CreateUserWithCredsCommand): Promise<User> {
    const newUser = await this.userRepository.create(
      {
        username: user.username,
        avatar: user.avatar,
        is_verified: false,
        type: UserType.user,
        description: user.description,
      },
      transaction,
    );

    await this.userAuthRepository.create(
      {
        user_id: newUser.id,
        email: user.email,
        password: user.password,
      },
      transaction,
    );

    return newUser;
  }
}
