import { Transaction } from 'sequelize';
import { LikeToPlaylistCreateParams } from '../secondary-adapters/postgres/query-params/like-to-playlist/create-like-to-playlist.params';
import { LikeToPlaylist } from '../application/data/like-to-playlist.dto';
import { LikeToPlaylistUpdateParams } from '../secondary-adapters/postgres/query-params/like-to-playlist/update-like-to-playlist.params';
import { GetLikeToPlaylistWhere } from '../secondary-adapters/postgres/query-params/like-to-playlist/get-like-to-playlist-where.params';

export interface LikeToPlaylistRepository {
  getAllWhere(where: GetLikeToPlaylistWhere): Promise<LikeToPlaylist[]>;

  // active (not soft-deleted) like
  getOneWhere(where: GetLikeToPlaylistWhere): Promise<LikeToPlaylist>;

  // any row of the pair, including a soft-deleted one, locked FOR UPDATE
  getOneForUpdate(
    where: Pick<GetLikeToPlaylistWhere, 'user_id' | 'playlist_id'>,
    transaction: Transaction,
  ): Promise<LikeToPlaylist>;

  create(
    dto: LikeToPlaylistCreateParams,
    transaction?: Transaction,
  ): Promise<LikeToPlaylist>;

  update(
    what: LikeToPlaylistUpdateParams,
    where: GetLikeToPlaylistWhere,
    transaction?: Transaction,
  ): Promise<LikeToPlaylist>;

  // sets deleted_at on the active likes matching `where`
  softDeleteWhere(
    where: GetLikeToPlaylistWhere,
    transaction?: Transaction,
  ): Promise<void>;
}

export const LikeToPlaylistRepositoryType = Symbol.for(
  'LikeToPlaylistRepository',
);
