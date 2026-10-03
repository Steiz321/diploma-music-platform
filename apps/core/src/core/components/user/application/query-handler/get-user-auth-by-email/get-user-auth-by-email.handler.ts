import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetUserAuthByEmailQuery } from './get-user-auth-by-email.query';
import { UserAuth } from '../../data/user-auth.dto';
import {
  UserAuthRepository,
  UserAuthRepositoryType,
} from '../../../ports/user-auth.repository';

@QueryHandler(GetUserAuthByEmailQuery)
export class GetUserAuthByEmailQueryHandler
  implements IQueryHandler<GetUserAuthByEmailQuery, UserAuth>
{
  constructor(
    @Inject(UserAuthRepositoryType)
    private readonly userAuthRepository: UserAuthRepository,
  ) {}

  public async execute({
    email,
  }: GetUserAuthByEmailQuery): Promise<UserAuth | null> {
    const userAuth = await this.userAuthRepository.getOneWhere({ email });

    return userAuth;
  }
}
