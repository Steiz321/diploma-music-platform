import { Transaction } from 'sequelize';
import { UserAuthUpdateParams } from '../../../secondary-adapters/postgres/query-params/user-auth/update-user-auth.params';

export class UpdateUserAuthCommand {
  constructor(
    public readonly userId: number,
    public readonly params: UserAuthUpdateParams,
    public readonly transaction?: Transaction,
  ) {}
}
