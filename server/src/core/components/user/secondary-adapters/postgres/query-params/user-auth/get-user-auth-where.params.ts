import { UserAuth } from 'src/core/components/user/application/data/user-auth.dto';

export type GetUserAuthWhere = Partial<
  Pick<
    UserAuth,
    | 'id'
    | 'email'
    | 'user_id'
    | 'refresh_token'
    | 'password'
    | 'deleted_at'
    | 'token'
  >
>;
