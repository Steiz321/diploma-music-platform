import { Transaction } from 'sequelize';
import { Song } from '../application/data/song.dto';
import { GetSongWhere } from '../secondary-adapters/postgres/query-params/song/get-song-where.params';
import { SongCreateParams } from '../secondary-adapters/postgres/query-params/song/create-song.params';
import { SongUpdateParams } from '../secondary-adapters/postgres/query-params/song/update-song.params';

export interface SongRepository {
  getAll(search: string): Promise<Song[]>;

  getOneWhere(where: GetSongWhere): Promise<Song>;

  getManyWhere(where: GetSongWhere): Promise<Song[]>;

  create(dto: SongCreateParams, transaction?: Transaction): Promise<Song>;

  update(
    what: SongUpdateParams,
    where: GetSongWhere,
    transaction?: Transaction,
  ): Promise<Song>;

  smartDelete(songId: number, transaction?: Transaction): Promise<undefined>;

  // atomic `listens = listens + 1` in the database
  incrementListens(songId: number, transaction?: Transaction): Promise<void>;
}

export const SongRepositoryType = Symbol.for('SongRepository');
