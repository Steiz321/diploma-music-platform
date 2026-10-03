import { Playlist } from '../../../../application/data/playlist.dto';

export type GetPlaylistWhere = Partial<
  Pick<
    Playlist,
    | 'id'
    | 'title'
    | 'description'
    | 'cover_url'
    | 'user_id'
    | 'is_private'
    | 'deleted_at'
  >
>;
