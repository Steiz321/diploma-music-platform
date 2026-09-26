import { Transaction } from 'sequelize';
import { LikeToPlaylistCreateParams } from '../secondary-adapters/postgres/query-params/like-to-playlist/create-like-to-playlist.params';
import { LikeToPlaylist } from '../application/data/like-to-playlist.dto';
import { LikeToPlaylistUpdateParams } from '../secondary-adapters/postgres/query-params/like-to-playlist/update-like-to-playlist.params';
import { GetLikeToPlaylistWhere } from '../secondary-adapters/postgres/query-params/like-to-playlist/get-like-to-playlist-where.params';

export interface LikeToPlaylistRepository {
  getAllWhere(where: GetLikeToPlaylistWhere): Promise<LikeToPlaylist[]>;

  getOneWhere(where: GetLikeToPlaylistWhere): Promise<LikeToPlaylist>;

  create(
    dto: LikeToPlaylistCreateParams,
    transaction?: Transaction,
  ): Promise<LikeToPlaylist>;

  update(
    what: LikeToPlaylistUpdateParams,
    where: GetLikeToPlaylistWhere,
    transaction?: Transaction,
  ): Promise<LikeToPlaylist>;

  delete(
    likeToPlaylistId: number,
    transaction?: Transaction,
  ): Promise<undefined>;
}

export const LikeToPlaylistRepositoryType = Symbol.for(
  'LikeToPlaylistRepository',
);
