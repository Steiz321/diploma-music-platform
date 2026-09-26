import { LikeToPlaylist } from 'src/core/components/like/application/data/like-to-playlist.dto';

export type GetLikeToPlaylistWhere = Partial<
  Pick<LikeToPlaylist, 'id' | 'playlist_id' | 'user_id' | 'deleted_at'>
>;
