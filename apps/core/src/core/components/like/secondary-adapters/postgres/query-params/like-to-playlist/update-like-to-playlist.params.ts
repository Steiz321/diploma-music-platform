import { LikeToPlaylist } from 'src/core/components/like/application/data/like-to-playlist.dto';

export type LikeToPlaylistUpdateParams = Partial<
  Pick<LikeToPlaylist, 'playlist_id' | 'user_id' | 'deleted_at'>
>;
