import { Transaction } from 'sequelize';
import { GetPlaylistWhere } from '../secondary-adapters/postgres/query-params/playlist/get-playlist-where.params';
import { PlaylistCreateParams } from '../secondary-adapters/postgres/query-params/playlist/create-playlist.params';
import { Playlist } from '../application/data/playlist.dto';
import { PlaylistUpdateParams } from '../secondary-adapters/postgres/query-params/playlist/update-playlist.params';

export interface PlaylistRepository {
  getAll(where: GetPlaylistWhere): Promise<Playlist[]>;

  getAllByUserId(userId: number): Promise<Playlist[]>;

  getOneWhere(where: GetPlaylistWhere): Promise<Playlist>;

  getOneWithRelations(where: GetPlaylistWhere): Promise<Playlist>;

  create(
    dto: PlaylistCreateParams,
    transaction?: Transaction,
  ): Promise<Playlist>;

  update(
    what: PlaylistUpdateParams,
    where: GetPlaylistWhere,
    transaction?: Transaction,
  ): Promise<Playlist>;

  smartDelete(
    playlistId: number,
    transaction?: Transaction,
  ): Promise<undefined>;
}

export const PlaylistRepositoryType = Symbol.for('PlaylistRepository');
