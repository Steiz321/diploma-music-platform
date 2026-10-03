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
import PlaylistModel from '../../../../song/secondary-adapters/postgres/data/playlist.model';

@Table({ tableName: 'like_to_playlist' })
export default class LikeToPlaylistModel extends Model<LikeToPlaylistModel> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Column
  user_id: number;

  @ForeignKey(() => PlaylistModel)
  @AllowNull(false)
  @Column
  playlist_id: number;

  @Default(DataType.NOW)
  @Column
  created_at: Date;

  @AllowNull
  @Column
  deleted_at: Date;

  @BelongsTo(() => UserModel)
  user: UserModel;

  @BelongsTo(() => PlaylistModel)
  playlist: PlaylistModel;
}
