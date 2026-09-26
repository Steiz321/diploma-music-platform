import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PlaylistRepository } from '../../../ports/playlist.repository';
import { Playlist } from '../../../application/data/playlist.dto';
import PlaylistModel from '../data/playlist.model';
import { GetPlaylistWhere } from '../query-params/playlist/get-playlist-where.params';
import { PlaylistCreateParams } from '../query-params/playlist/create-playlist.params';
import { Transaction } from 'sequelize';
import { PlaylistUpdateParams } from '../query-params/playlist/update-playlist.params';

@Injectable()
export class PlaylistRepositoryAdapter implements PlaylistRepository {
  constructor(
    @InjectModel(PlaylistModel)
    private readonly playlistModel: typeof PlaylistModel,
  ) {}

  async getAll(where: GetPlaylistWhere): Promise<Playlist[]> {
    const playlists = await this.playlistModel.findAll({
      where: { ...where, is_private: false, deleted_at: null },
      order: [['created_at', 'DESC']],
      include: [
        {
          association: 'user',
          where: { deleted_at: null },
          required: true,
        },
        {
          association: 'songs',
          where: { deleted_at: null },
          required: false,
          through: { attributes: [] },
          include: [
            {
              association: 'user',
              required: true,
              where: { deleted_at: null },
            },
          ],
        },
      ],
    });
    return playlists.map((playlist) => playlist.toJSON());
  }

  async getAllByUserId(userId: number): Promise<Playlist[]> {
    const playlists = await this.playlistModel.findAll({
      where: { user_id: userId, is_private: false, deleted_at: null },
      order: [['created_at', 'DESC']],
      include: [
        {
          association: 'user',
          required: true,
        },
        {
          association: 'songs',
          required: false,
          through: { attributes: [] },
          include: [
            {
              association: 'user',
              required: true,
            },
          ],
        },
      ],
    });
    return playlists.map((playlist) => playlist.toJSON());
  }

  async getOneWhere(where: GetPlaylistWhere): Promise<Playlist> {
    const playlist = await this.playlistModel.findOne({ where });
    return playlist?.toJSON() || null;
  }

  async getOneWithRelations(where: GetPlaylistWhere): Promise<Playlist> {
    const playlist = await this.playlistModel.findOne({
      where: {
        ...where,
        deleted_at: null,
      },
      include: [
        {
          association: 'songs',
          required: false,
          include: [
            {
              association: 'user',
              required: true,
            },
          ],
        },
        {
          association: 'user',
          required: true,
        },
      ],
    });

    return playlist?.toJSON() || null;
  }

  async create(
    dto: PlaylistCreateParams,
    transaction?: Transaction,
  ): Promise<Playlist> {
    const playlist = await this.playlistModel.create(dto, { transaction });
    return playlist?.toJSON() || null;
  }

  async update(
    what: PlaylistUpdateParams,
    where: GetPlaylistWhere,
    transaction?: Transaction,
  ): Promise<Playlist> {
    const playlist = await this.playlistModel.update(what, {
      where,
      transaction,
      returning: true,
    });

    return playlist[1][0]?.toJSON() || null;
  }

  async smartDelete(
    playlistId: number,
    transaction?: Transaction,
  ): Promise<undefined> {
    await this.playlistModel.update(
      { deleted_at: new Date() },
      { where: { id: playlistId }, transaction },
    );
  }
}
