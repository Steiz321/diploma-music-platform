import { Transaction } from 'sequelize';
import { GetLikeToSongWhere } from '../secondary-adapters/postgres/query-params/like-to-song/get-like-to-song-where.params';
import { LikeToSong } from '../application/data/like-to-song.dto';
import { LikeToSongCreateParams } from '../secondary-adapters/postgres/query-params/like-to-song/create-like-to-song.params';
import { LikeToSongUpdateParams } from '../secondary-adapters/postgres/query-params/like-to-song/update-like-to-song.params';

export interface LikeToSongRepository {
  getAllWhere(where: GetLikeToSongWhere): Promise<LikeToSong[]>;

  getOneWhere(where: GetLikeToSongWhere): Promise<LikeToSong>;

  create(
    dto: LikeToSongCreateParams,
    transaction?: Transaction,
  ): Promise<LikeToSong>;

  update(
    what: LikeToSongUpdateParams,
    where: GetLikeToSongWhere,
    transaction?: Transaction,
  ): Promise<LikeToSong>;

  delete(likeToSongId: number, transaction?: Transaction): Promise<undefined>;
}

export const LikeToSongRepositoryType = Symbol.for('LikeToSongRepository');
