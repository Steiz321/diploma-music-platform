export class Comment {
  id: number;
  song_id: number;
  user_id: number;
  text: string;
  created_at: Date;
  deleted_at?: Date;
}
