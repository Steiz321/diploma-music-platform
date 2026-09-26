import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import {
  UserRepository,
  UserRepositoryType,
} from '../../../ports/user.repository';
import { User } from '../../data/user.dto';
import { GetUserByIdQuery } from './get-user-by-id.query';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdQueryHandler
  implements IQueryHandler<GetUserByIdQuery, User>
{
  constructor(
    @Inject(UserRepositoryType)
    private readonly userRepository: UserRepository,
  ) {}

  public async execute({ id }: GetUserByIdQuery): Promise<User | null> {
    const user = await this.userRepository.getOneWhere({ id });

    return user;
  }
}
