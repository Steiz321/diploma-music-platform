import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import CommentModel from '../../../../comment/secondary-adapters/postgres/data/comment.model';
import ListensModel from './listens.model';
import LikeToSongModel from '../../../../like/secondary-adapters/postgres/data/like-to-song.model';
import UserModel from 'src/core/components/user/secondary-adapters/postgres/data/user.model';

@Table({ tableName: 'song' })
export default class SongModel extends Model<SongModel> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Column
  description: string;

  @Column
  @AllowNull
  @Column
  cover_url: string;

  @ForeignKey(() => UserModel)
  @Column
  user_id: number;

  @AllowNull
  @Column
  text: string;

  @Column
  audio: string;

  @Default(0)
  @Column
  listens: number;

  @Default(DataType.NOW)
  @Column
  created_at: Date;

  @AllowNull
  @Column
  deleted_at: Date;

  // Relations

  @BelongsTo(() => UserModel)
  user: UserModel;

  @HasMany(() => CommentModel)
  comments: CommentModel[];

  @HasMany(() => ListensModel)
  listens_records: ListensModel[];

  @HasMany(() => LikeToSongModel)
  likes: LikeToSongModel[];
}
