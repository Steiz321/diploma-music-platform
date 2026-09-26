import { LikeToPlaylist } from 'src/core/components/like/application/data/like-to-playlist.dto';

export type LikeToPlaylistCreateParams = Pick<
  LikeToPlaylist,
  'playlist_id' | 'user_id'
>;
