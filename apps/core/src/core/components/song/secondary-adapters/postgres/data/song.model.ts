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
import { TranscriptionStatus } from 'src/core/shared-kernel/data/enum/transcription-status.enum';
import { TranscriptionResult } from 'src/core/shared-kernel/ports/transcription-service.interface';

@Table({ tableName: 'song' })
export default class SongModel extends Model<SongModel> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  name: string;

  @Column(DataType.TEXT)
  description: string;

  @AllowNull
  @Column(DataType.TEXT)
  cover_url: string;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Column
  user_id: number;

  @AllowNull
  @Column(DataType.TEXT)
  text: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  audio: string;

  @Default(0)
  @Column
  listens: number;

  @AllowNull
  @Column(DataType.JSONB)
  transcription: TranscriptionResult | null;

  @AllowNull(false)
  @Default(TranscriptionStatus.pending)
  @Column(DataType.ENUM(...Object.values(TranscriptionStatus)))
  transcription_status: TranscriptionStatus;

  @AllowNull
  @Column
  language: string | null;

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
