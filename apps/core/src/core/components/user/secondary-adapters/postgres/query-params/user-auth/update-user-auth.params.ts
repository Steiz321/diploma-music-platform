import { UserAuth } from 'src/core/components/user/application/data/user-auth.dto';

export type UserAuthUpdateParams = Partial<
  Pick<
    UserAuth,
    | 'email'
    | 'password'
    | 'user_id'
    | 'token'
    | 'refresh_token'
    | 'created_at'
    | 'deleted_at'
  >
>;
