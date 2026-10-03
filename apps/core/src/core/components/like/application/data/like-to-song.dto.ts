import { Song } from 'src/core/components/song/application/data/song.dto';

export class LikeToSong {
  id: number;
  user_id: number;
  song_id: number;
  created_at: Date;
  deleted_at?: Date;
}
