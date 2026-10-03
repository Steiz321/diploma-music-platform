import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UserAuth } from '../../data/user-auth.dto';
import {
  UserAuthRepository,
  UserAuthRepositoryType,
} from '../../../ports/user-auth.repository';
import { GetUserAuthByTokenQuery } from './get-user-auth-by-token.query';

@QueryHandler(GetUserAuthByTokenQuery)
export class GetUserAuthByTokenQueryHandler
  implements IQueryHandler<GetUserAuthByTokenQuery, UserAuth>
{
  constructor(
    @Inject(UserAuthRepositoryType)
    private readonly userAuthRepository: UserAuthRepository,
  ) {}

  public async execute({
    token,
  }: GetUserAuthByTokenQuery): Promise<UserAuth | null> {
    const userAuth = await this.userAuthRepository.getOneWhere({ token });

    return userAuth;
  }
}
