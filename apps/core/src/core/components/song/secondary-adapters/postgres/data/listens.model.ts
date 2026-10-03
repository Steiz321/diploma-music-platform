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
import SongModel from './song.model';

@Table({ tableName: 'listens' })
export default class ListensModel extends Model<ListensModel> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Column
  user_id: number;

  @ForeignKey(() => SongModel)
  @AllowNull(false)
  @Column
  song_id: number;

  @Default(DataType.NOW)
  @Column
  created_at: Date;

  @AllowNull
  @Column
  deleted_at: Date;

  @BelongsTo(() => UserModel)
  user: UserModel;

  @BelongsTo(() => SongModel)
  song: SongModel;
}
