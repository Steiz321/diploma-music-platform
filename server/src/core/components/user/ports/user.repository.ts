import { Transaction } from 'sequelize';
import { User } from '../application/data/user.dto';
import { GetUserWhere } from '../secondary-adapters/postgres/query-params/user/get-user-where.params';
import { UserCreateParams } from '../secondary-adapters/postgres/query-params/user/create-user.params';
import { UserUpdateParams } from '../secondary-adapters/postgres/query-params/user/update-user.params';

export interface UserRepository {
  getOneWithLikedSongs(userId: number): Promise<User>;

  getOneWithLikedPlaylists(userId: number): Promise<User>;

  getOneWithOwnSongs(userId: number): Promise<User>;

  getOneWithPlaylists(userId: number): Promise<User>;

  getOneWhere(where: GetUserWhere): Promise<User>;

  create(dto: UserCreateParams, transaction?: Transaction): Promise<User>;

  update(
    what: UserUpdateParams,
    where: GetUserWhere,
    transaction?: Transaction,
  ): Promise<User>;

  smartDelete(userId: number, transaction?: Transaction): Promise<undefined>;
}

export const UserRepositoryType = Symbol.for('UserRepository');
