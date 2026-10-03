import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SongToPlaylistRepository } from '../../../ports/song-to-playlist.repository';
import { SongToPlaylist } from '../../../application/data/song-to-playlist.dto';
import SongToPlaylistModel from '../data/song-to-playlist.model';
import { GetSongToPlaylistWhere } from '../query-params/song-to-playlist/get-song-to-playlist-where.params';
import { SongToPlaylistCreateParams } from '../query-params/song-to-playlist/create-song-to-playlist.params';
import { Transaction } from 'sequelize';
import { SongToPlaylistUpdateParams } from '../query-params/song-to-playlist/update-song-to-playlist.params';

@Injectable()
export class SongToPlaylistRepositoryAdapter
  implements SongToPlaylistRepository
{
  constructor(
    @InjectModel(SongToPlaylistModel)
    private readonly songToPlaylistModel: typeof SongToPlaylistModel,
  ) {}

  async getAllWhere(where: GetSongToPlaylistWhere): Promise<SongToPlaylist[]> {
    const songToPlaylists = await this.songToPlaylistModel.findAll({
      where: { ...where, deleted_at: null },
    });

    return songToPlaylists.map((songToPlaylist) => songToPlaylist.toJSON());
  }

  async getOneWhere(where: GetSongToPlaylistWhere): Promise<SongToPlaylist> {
    const songToPlaylist = await this.songToPlaylistModel.findOne({
      where: { ...where, deleted_at: null },
    });

    return songToPlaylist?.toJSON() || null;
  }

  async create(
    dto: SongToPlaylistCreateParams,
    transaction?: Transaction,
  ): Promise<SongToPlaylist> {
    const songToPlaylist = await this.songToPlaylistModel.create(dto, {
      transaction,
    });

    return songToPlaylist?.toJSON() || null;
  }

  async update(
    what: SongToPlaylistUpdateParams,
    where: GetSongToPlaylistWhere,
    transaction?: Transaction,
  ): Promise<SongToPlaylist> {
    const songToPlaylist = await this.songToPlaylistModel.update(what, {
      where,
      transaction,
      returning: true,
    });

    return songToPlaylist[1][0].toJSON() || null;
  }

  async delete(
    songToPlaylistId: number,
    transaction?: Transaction,
  ): Promise<number> {
    return this.songToPlaylistModel.destroy({
      where: { id: songToPlaylistId },
      transaction,
    });
  }
}
