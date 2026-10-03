import { Transaction } from 'sequelize';
import { GetListensWhere } from '../secondary-adapters/postgres/query-params/listens/get-listens-where.params';
import { ListensCreateParams } from '../secondary-adapters/postgres/query-params/listens/create-listens.params';
import { Listens } from '../application/data/listens.dto';
import { ListensUpdateParams } from '../secondary-adapters/postgres/query-params/listens/update-listens.params';

export interface ListensRepository {
  getAllWhere(where: GetListensWhere): Promise<Listens[]>;

  getOneWhere(where: GetListensWhere): Promise<Listens>;

  create(dto: ListensCreateParams, transaction?: Transaction): Promise<Listens>;

  update(
    what: ListensUpdateParams,
    where: GetListensWhere,
    transaction?: Transaction,
  ): Promise<Listens>;

  delete(listenId: number, transaction?: Transaction): Promise<number>;
}

export const ListensRepositoryType = Symbol.for('ListensRepository');
