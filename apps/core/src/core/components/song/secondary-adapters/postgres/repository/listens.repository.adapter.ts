import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ListensRepository } from '../../../ports/listens.repository';
import { Listens } from '../../../application/data/listens.dto';
import ListensModel from '../data/listens.model';
import { GetListensWhere } from '../query-params/listens/get-listens-where.params';
import { ListensCreateParams } from '../query-params/listens/create-listens.params';
import { Transaction } from 'sequelize';
import { ListensUpdateParams } from '../query-params/listens/update-listens.params';

@Injectable()
export class ListensRepositoryAdapter implements ListensRepository {
  constructor(
    @InjectModel(ListensModel)
    private readonly listensModel: typeof ListensModel,
  ) {}

  async getAllWhere(where: GetListensWhere): Promise<Listens[]> {
    const listens = await this.listensModel.findAll({
      where: { ...where, deleted_at: null },
    });
    return listens.map((listen) => listen.toJSON());
  }

  async getOneWhere(where: GetListensWhere): Promise<Listens> {
    const listens = await this.listensModel.findOne({
      where: { ...where, deleted_at: null },
    });
    return listens?.toJSON() || null;
  }

  async create(
    dto: ListensCreateParams,
    transaction?: Transaction,
  ): Promise<Listens> {
    const listens = await this.listensModel.create(dto, { transaction });
    return listens?.toJSON() || null;
  }

  async update(
    what: ListensUpdateParams,
    where: GetListensWhere,
    transaction?: Transaction,
  ): Promise<Listens> {
    const listens = await this.listensModel.update(what, {
      where,
      transaction,
      returning: true,
    });
    return listens[1][0]?.toJSON() || null;
  }

  async delete(listenId: number, transaction?: Transaction): Promise<number> {
    return this.listensModel.destroy({
      where: { id: listenId },
      transaction,
    });
  }
}
