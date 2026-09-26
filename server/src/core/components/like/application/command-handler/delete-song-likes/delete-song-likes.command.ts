import { Transaction } from 'sequelize';

export class DeleteSongLikesCommand {
  constructor(
    public readonly songId: number,
    public readonly transaction?: Transaction,
  ) {}
}
