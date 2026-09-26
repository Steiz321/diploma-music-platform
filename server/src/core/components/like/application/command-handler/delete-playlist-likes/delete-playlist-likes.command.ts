import { Transaction } from 'sequelize';

export class DeletePlaylistLikesCommand {
  constructor(
    public readonly playlistId: number,
    public readonly transaction?: Transaction,
  ) {}
}
