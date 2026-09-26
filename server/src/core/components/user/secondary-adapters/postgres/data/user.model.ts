import {
  AllowNull,
  AutoIncrement,
  BelongsToMany,
  Column,
  DataType,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import LikeToPlaylistModel from 'src/core/components/like/secondary-adapters/postgres/data/like-to-playlist.model';
import LikeToSongModel from 'src/core/components/like/secondary-adapters/postgres/data/like-to-song.model';
import PlaylistModel from 'src/core/components/song/secondary-adapters/postgres/data/playlist.model';
import SongModel from 'src/core/components/song/secondary-adapters/postgres/data/song.model';
import { UserType } from 'src/core/shared-kernel/data/enum/user-type.enum';

@Table({ tableName: 'user' })
export default class UserModel extends Model<UserModel> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  username: string;

  @AllowNull
  @Column
  description: string;

  @AllowNull
  @Column
  avatar: string;

  @Default(UserType.user)
  @Column(DataType.ENUM(...Object.values(UserType)))
  type: UserType;

  @Default(false)
  @Column
  is_verified: boolean;

  @Column
  created_at: Date;

  @AllowNull
  @Column
  deleted_at: Date | null;

  @HasMany(() => SongModel)
  songs: SongModel[];

  @BelongsToMany(() => SongModel, () => LikeToSongModel)
  liked_songs: SongModel[];

  @HasMany(() => PlaylistModel)
  playlists: PlaylistModel[];

  @BelongsToMany(() => PlaylistModel, () => LikeToPlaylistModel)
  liked_playlists: PlaylistModel[];
}
