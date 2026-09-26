import { User } from '../../../../application/data/user.dto';

export type UserUpdateParams = Partial<
  Pick<
    User,
    | 'username'
    | 'description'
    | 'avatar'
    | 'is_verified'
    | 'type'
    | 'deleted_at'
  >
>;
