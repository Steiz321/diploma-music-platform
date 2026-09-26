import { User } from '../../../../application/data/user.dto';

export type UserCreateParams = Pick<
  User,
  'username' | 'description' | 'avatar' | 'is_verified' | 'type'
>;
