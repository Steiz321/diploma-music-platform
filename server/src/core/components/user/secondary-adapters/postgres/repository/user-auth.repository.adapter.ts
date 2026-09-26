import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import UserAuthModel from '../data/user-auth.model';
import { UserAuthRepository } from '../../../ports/user-auth.repository';
import { UserAuth } from '../../../application/data/user-auth.dto';
import { GetUserAuthWhere } from '../query-params/user-auth/get-user-auth-where.params';
import { UserAuthCreateParams } from '../query-params/user-auth/create-user-auth.params';
import { UserAuthUpdateParams } from '../query-params/user-auth/update-user-auth.params';
import { Transaction } from 'sequelize';

@Injectable()
export class UserAuthRepositoryAdapter implements UserAuthRepository {
  constructor(
    @InjectModel(UserAuthModel)
    private readonly userAuthModel: typeof UserAuthModel,
  ) {}

  async getOneWhere(where: GetUserAuthWhere): Promise<UserAuth | null> {
    const userAuth = await this.userAuthModel.findOne({ where });

    return userAuth?.toJSON() || null;
  }

  async create(
    dto: UserAuthCreateParams,
    transaction?: Transaction,
  ): Promise<UserAuth> {
    const userAuth = await this.userAuthModel.create(dto, { transaction });

    return userAuth?.toJSON() || null;
  }

  async update(
    what: UserAuthUpdateParams,
    where: GetUserAuthWhere,
    transaction?: Transaction,
  ): Promise<UserAuth> {
    const userAuth = await this.userAuthModel.update(what, {
      where,
      transaction,
      returning: true,
    });

    return userAuth[1][0].toJSON();
  }

  async smartDelete(id: number, transaction?: Transaction): Promise<undefined> {
    await this.userAuthModel.update(
      { deleted_at: new Date() },
      { where: { id }, transaction },
    );

    return;
  }
}
