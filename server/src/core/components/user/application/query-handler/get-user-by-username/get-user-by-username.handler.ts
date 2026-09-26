import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetUserByUsernameQuery } from './get-user-by-username.query';
import {
  UserRepository,
  UserRepositoryType,
} from '../../../ports/user.repository';
import { User } from '../../data/user.dto';

@QueryHandler(GetUserByUsernameQuery)
export class GetUserByUsernameQueryHandler
  implements IQueryHandler<GetUserByUsernameQuery, User>
{
  constructor(
    @Inject(UserRepositoryType)
    private readonly userRepository: UserRepository,
  ) {}

  public async execute({
    username,
  }: GetUserByUsernameQuery): Promise<User | null> {
    const user = await this.userRepository.getOneWhere({ username });

    return user;
  }
}
