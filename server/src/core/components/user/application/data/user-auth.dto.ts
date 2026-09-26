export class UserAuth {
  id: number;
  user_id: number;
  email: string;
  password: string;
  token?: string;
  refresh_token?: string;
  created_at: Date;
  deleted_at?: Date;
}
