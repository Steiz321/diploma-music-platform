import { Song } from '../../../../application/data/song.dto';

export type SongUpdateParams = Partial<
  Pick<
    Song,
    | 'name'
    | 'description'
    | 'cover_url'
    | 'user_id'
    | 'text'
    | 'audio'
    | 'listens'
    | 'transcription'
    | 'transcription_status'
    | 'language'
    | 'deleted_at'
  >
>;
