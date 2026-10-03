import { Transaction } from 'sequelize';
import { GetLikeToSongWhere } from '../secondary-adapters/postgres/query-params/like-to-song/get-like-to-song-where.params';
import { LikeToSong } from '../application/data/like-to-song.dto';
import { LikeToSongCreateParams } from '../secondary-adapters/postgres/query-params/like-to-song/create-like-to-song.params';
import { LikeToSongUpdateParams } from '../secondary-adapters/postgres/query-params/like-to-song/update-like-to-song.params';

export interface LikeToSongRepository {
  getAllWhere(where: GetLikeToSongWhere): Promise<LikeToSong[]>;

  // active (not soft-deleted) like
  getOneWhere(where: GetLikeToSongWhere): Promise<LikeToSong>;

  // any row of the pair, including a soft-deleted one, locked FOR UPDATE
  getOneForUpdate(
    where: Pick<GetLikeToSongWhere, 'user_id' | 'song_id'>,
    transaction: Transaction,
  ): Promise<LikeToSong>;

  create(
    dto: LikeToSongCreateParams,
    transaction?: Transaction,
  ): Promise<LikeToSong>;

  update(
    what: LikeToSongUpdateParams,
    where: GetLikeToSongWhere,
    transaction?: Transaction,
  ): Promise<LikeToSong>;

  // sets deleted_at on the active likes matching `where`
  softDeleteWhere(
    where: GetLikeToSongWhere,
    transaction?: Transaction,
  ): Promise<void>;
}

export const LikeToSongRepositoryType = Symbol.for('LikeToSongRepository');
