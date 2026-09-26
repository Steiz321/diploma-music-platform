import { Playlist } from '../../../../application/data/playlist.dto';

export type PlaylistUpdateParams = Partial<
  Pick<
    Playlist,
    | 'title'
    | 'description'
    | 'cover_url'
    | 'user_id'
    | 'is_private'
    | 'deleted_at'
  >
>;
