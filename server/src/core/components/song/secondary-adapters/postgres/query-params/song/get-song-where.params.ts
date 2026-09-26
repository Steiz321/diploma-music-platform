import { Song } from '../../../../application/data/song.dto';

export type GetSongWhere = Partial<
  Pick<
    Song,
    | 'id'
    | 'name'
    | 'description'
    | 'cover_url'
    | 'user_id'
    | 'text'
    | 'audio'
    | 'deleted_at'
  >
>;
