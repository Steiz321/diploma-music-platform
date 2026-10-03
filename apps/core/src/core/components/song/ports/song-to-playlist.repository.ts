import { Transaction } from 'sequelize';
import { GetSongToPlaylistWhere } from '../secondary-adapters/postgres/query-params/song-to-playlist/get-song-to-playlist-where.params';
import { SongToPlaylist } from '../application/data/song-to-playlist.dto';
import { SongToPlaylistCreateParams } from '../secondary-adapters/postgres/query-params/song-to-playlist/create-song-to-playlist.params';
import { SongToPlaylistUpdateParams } from '../secondary-adapters/postgres/query-params/song-to-playlist/update-song-to-playlist.params';

export interface SongToPlaylistRepository {
  getAllWhere(where: GetSongToPlaylistWhere): Promise<SongToPlaylist[]>;

  getOneWhere(where: GetSongToPlaylistWhere): Promise<SongToPlaylist>;

  create(
    dto: SongToPlaylistCreateParams,
    transaction?: Transaction,
  ): Promise<SongToPlaylist>;

  update(
    what: SongToPlaylistUpdateParams,
    where: GetSongToPlaylistWhere,
    transaction?: Transaction,
  ): Promise<SongToPlaylist>;

  delete(songToPlaylistId: number, transaction?: Transaction): Promise<number>;
}

export const SongToPlaylistRepositoryType = Symbol.for(
  'SongToPlaylistRepository',
);
