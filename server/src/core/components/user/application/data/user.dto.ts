import { Playlist } from 'src/core/components/song/application/data/playlist.dto';
import { Song } from 'src/core/components/song/application/data/song.dto';
import { UserType } from 'src/core/shared-kernel/data/enum/user-type.enum';

export class User {
  id: number;
  username: string;
  description?: string;
  avatar: string;
  type: UserType;
  is_verified: boolean;
  created_at: Date;
  deleted_at: Date | null;

  songs: Song[];
  liked_songs: Song[];
  playlists: Playlist[];
  liked_playlists: Playlist[];
}
