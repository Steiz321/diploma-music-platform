import { Transaction } from 'sequelize';
import { GetUserAuthWhere } from '../secondary-adapters/postgres/query-params/user-auth/get-user-auth-where.params';
import { UserAuth } from '../application/data/user-auth.dto';
import { UserAuthCreateParams } from '../secondary-adapters/postgres/query-params/user-auth/create-user-auth.params';
import { UserAuthUpdateParams } from '../secondary-adapters/postgres/query-params/user-auth/update-user-auth.params';

export interface UserAuthRepository {
  getOneWhere(where: GetUserAuthWhere): Promise<UserAuth>;

  create(
    dto: UserAuthCreateParams,
    transaction?: Transaction,
  ): Promise<UserAuth>;

  update(
    what: UserAuthUpdateParams,
    where: GetUserAuthWhere,
    transaction?: Transaction,
  ): Promise<UserAuth>;

  smartDelete(id: number, transaction?: Transaction): Promise<undefined>;
}

export const UserAuthRepositoryType = Symbol.for('UserAuthRepository');
