import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LikeToPlaylistRepository } from '../../../ports/like-to-playlist.repository';
import { LikeToPlaylist } from '../../../application/data/like-to-playlist.dto';
import LikeToPlaylistModel from '../data/like-to-playlist.model';
import { GetLikeToPlaylistWhere } from '../query-params/like-to-playlist/get-like-to-playlist-where.params';
import { LikeToPlaylistCreateParams } from '../query-params/like-to-playlist/create-like-to-playlist.params';
import { Transaction } from 'sequelize';
import { LikeToPlaylistUpdateParams } from '../query-params/like-to-playlist/update-like-to-playlist.params';

@Injectable()
export class LikeToPlaylistRepositoryAdapter
  implements LikeToPlaylistRepository
{
  constructor(
    @InjectModel(LikeToPlaylistModel)
    private readonly likeToPlaylistModel: typeof LikeToPlaylistModel,
  ) {}

  async getAllWhere(where: GetLikeToPlaylistWhere): Promise<LikeToPlaylist[]> {
    const likes = await this.likeToPlaylistModel.findAll({
      where: { ...where, deleted_at: null },
    });
    return likes.map((like) => like.toJSON());
  }

  async getOneWhere(where: GetLikeToPlaylistWhere): Promise<LikeToPlaylist> {
    const likeToPlaylist = await this.likeToPlaylistModel.findOne({ where });
    return likeToPlaylist?.toJSON() || null;
  }

  async create(
    dto: LikeToPlaylistCreateParams,
    transaction?: Transaction,
  ): Promise<LikeToPlaylist> {
    const likeToPlaylist = await this.likeToPlaylistModel.create(dto, {
      transaction,
    });
    return likeToPlaylist?.toJSON() || null;
  }

  async update(
    what: LikeToPlaylistUpdateParams,
    where: GetLikeToPlaylistWhere,
    transaction?: Transaction,
  ): Promise<LikeToPlaylist> {
    const likeToPlaylist = await this.likeToPlaylistModel.update(what, {
      where,
      transaction,
      returning: true,
    });
    return likeToPlaylist[1][0]?.toJSON() || null;
  }

  async delete(
    likeToPlaylistId: number,
    transaction?: Transaction,
  ): Promise<undefined> {
    await this.likeToPlaylistModel.destroy({
      where: { id: likeToPlaylistId },
      transaction,
    });
    return;
  }
}
