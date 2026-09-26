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
import SongModel from './song.model';
import PlaylistModel from './playlist.model';

@Table({
  tableName: 'song_to_playlist',
})
export default class SongToPlaylistModel extends Model<SongToPlaylistModel> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => SongModel)
  @Column
  song_id: number;

  @ForeignKey(() => PlaylistModel)
  @Column
  playlist_id: number;

  @Default(DataType.NOW)
  @Column
  created_at: Date;

  @AllowNull
  @Column
  deleted_at: Date;

  @BelongsTo(() => SongModel)
  song: SongModel;

  @BelongsTo(() => PlaylistModel)
  playlist: PlaylistModel;
}
