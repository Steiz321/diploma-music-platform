import { Transaction } from 'sequelize';

interface CreateUserWithCredsArgument {
  username: string;
  description: string;
  avatar: string;
  email: string;
  password: string;
}

export class CreateUserWithCredsCommand {
  constructor(
    public readonly user: CreateUserWithCredsArgument,
    public readonly transaction?: Transaction,
  ) {}
}
