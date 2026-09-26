import { Playlist } from '../../../../application/data/playlist.dto';

export type PlaylistCreateParams = Pick<
  Playlist,
  'title' | 'description' | 'cover_url' | 'user_id' | 'is_private'
>;
