import { Song } from '../../../../application/data/song.dto';

export type SongCreateParams = Pick<
  Song,
  'name' | 'cover_url' | 'user_id' | 'audio' | 'description' | 'text'
>;
