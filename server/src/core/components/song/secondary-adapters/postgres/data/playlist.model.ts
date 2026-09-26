import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import UserModel from '../../../../user/secondary-adapters/postgres/data/user.model';
import SongModel from './song.model';
import SongToPlaylistModel from './song-to-playlist.model';
import LikeToPlaylistModel from '../../../../like/secondary-adapters/postgres/data/like-to-playlist.model';

@Table({ tableName: 'playlist' })
export default class PlaylistModel extends Model<PlaylistModel> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  title: string;

  @AllowNull
  @Column
  description: string;

  @AllowNull
  @Column
  cover_url: string;

  @ForeignKey(() => UserModel)
  @Column
  user_id: number;

  @Default(false)
  @Column
  is_private: boolean;

  @Default(DataType.NOW)
  @Column
  created_at: Date;

  @AllowNull
  @Column
  deleted_at: Date;

  @BelongsTo(() => UserModel)
  user: UserModel;

  @BelongsToMany(() => SongModel, () => SongToPlaylistModel)
  songs: SongModel[];

  @HasMany(() => LikeToPlaylistModel)
  likes: LikeToPlaylistModel[];
}
