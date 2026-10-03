import { User } from '../../../../application/data/user.dto';

export type GetUserWhere = Partial<
  Pick<
    User,
    | 'id'
    | 'username'
    | 'description'
    | 'avatar'
    | 'is_verified'
    | 'type'
    | 'deleted_at'
  >
>;
