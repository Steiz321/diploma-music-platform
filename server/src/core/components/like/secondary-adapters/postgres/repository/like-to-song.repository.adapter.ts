import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LikeToSongRepository } from '../../../ports/like-to-song.repository';
import { LikeToSong } from '../../../application/data/like-to-song.dto';
import LikeToSongModel from '../data/like-to-song.model';
import { LikeToSongCreateParams } from '../query-params/like-to-song/create-like-to-song.params';
import { LikeToSongUpdateParams } from '../query-params/like-to-song/update-like-to-song.params';
import { GetLikeToSongWhere } from '../query-params/like-to-song/get-like-to-song-where.params';
import { Transaction } from 'sequelize';

@Injectable()
export class LikeToSongRepositoryAdapter implements LikeToSongRepository {
  constructor(
    @InjectModel(LikeToSongModel)
    private readonly likeToSongModel: typeof LikeToSongModel,
  ) {}

  async getAllWhere(where: GetLikeToSongWhere): Promise<LikeToSong[]> {
    const likes = await this.likeToSongModel.findAll({
      where: { ...where, deleted_at: null },
    });
    return likes.map((like) => like.toJSON());
  }

  async getOneWhere(where: GetLikeToSongWhere): Promise<LikeToSong> {
    const likeToSong = await this.likeToSongModel.findOne({ where });
    return likeToSong?.toJSON() || null;
  }

  async create(
    dto: LikeToSongCreateParams,
    transaction?: Transaction,
  ): Promise<LikeToSong> {
    const likeToSong = await this.likeToSongModel.create(dto, { transaction });
    return likeToSong?.toJSON() || null;
  }

  async update(
    what: LikeToSongUpdateParams,
    where: GetLikeToSongWhere,
    transaction?: Transaction,
  ): Promise<LikeToSong> {
    const likeToSong = await this.likeToSongModel.update(what, {
      where,
      transaction,
      returning: true,
    });
    return likeToSong[1][0]?.toJSON() || null;
  }

  async delete(
    likeToSongId: number,
    transaction?: Transaction,
  ): Promise<undefined> {
    await this.likeToSongModel.destroy({
      where: { id: likeToSongId },
      transaction,
    });
    return;
  }
}
