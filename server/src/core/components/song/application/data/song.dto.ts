import { User } from 'src/core/components/user/application/data/user.dto';

export class Song {
  id: number;
  name: string;
  description: string;
  cover_url?: string;
  user_id: number;
  text?: string;
  audio: string;
  listens: number;
  created_at: Date;
  deleted_at?: Date;

  user?: User;
}
