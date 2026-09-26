import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import UserModel from '../../../../user/secondary-adapters/postgres/data/user.model';
import SongModel from '../../../../song/secondary-adapters/postgres/data/song.model';

@Table({ tableName: 'comment' })
export default class CommentModel extends Model<CommentModel> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => SongModel)
  @AllowNull(false)
  @Column
  song_id: number;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Column
  user_id: number;

  @AllowNull(false)
  @Column(DataType.TEXT)
  text: string;

  @Default(DataType.NOW)
  @Column
  created_at: Date;

  @AllowNull
  @Column
  deleted_at: Date;

  @BelongsTo(() => SongModel)
  song: SongModel;

  @BelongsTo(() => UserModel)
  user: UserModel;
}
