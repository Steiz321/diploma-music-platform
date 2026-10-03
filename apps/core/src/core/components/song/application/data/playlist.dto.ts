import { User } from 'src/core/components/user/application/data/user.dto';
import { Song } from './song.dto';

export class Playlist {
  id: number;
  title: string;
  description?: string;
  cover_url?: string;
  user_id: number;
  is_private: boolean;
  created_at: Date;
  deleted_at?: Date;
  songs: Song[];
  user: User;
}
