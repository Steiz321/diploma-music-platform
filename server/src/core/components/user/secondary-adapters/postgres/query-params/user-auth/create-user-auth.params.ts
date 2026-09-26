import { UserAuth } from 'src/core/components/user/application/data/user-auth.dto';

export type UserAuthCreateParams = Pick<
  UserAuth,
  'email' | 'password' | 'user_id' | 'token' | 'refresh_token'
>;
