import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  UserAuthRepository,
  UserAuthRepositoryType,
} from 'src/core/components/user/ports/user-auth.repository';
import { User } from '../../data/user.dto';
import { Inject } from '@nestjs/common';
import { UpdateUserAuthCommand } from './update-user-auth.command';
import { UserAuth } from '../../data/user-auth.dto';

@CommandHandler(UpdateUserAuthCommand)
export class UpdateUserAuthCommandHandler
  implements ICommandHandler<UpdateUserAuthCommand, UserAuth>
{
  constructor(
    @Inject(UserAuthRepositoryType)
    private readonly userAuthRepository: UserAuthRepository,
  ) {}

  public async execute({
    userId,
    params,
    transaction,
  }: UpdateUserAuthCommand): Promise<UserAuth> {
    const updatedUserAuth = await this.userAuthRepository.update(
      params,
      {
        user_id: userId,
      },
      transaction,
    );

    return updatedUserAuth;
  }
}
