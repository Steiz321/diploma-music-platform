import { SongToPlaylist } from '../../../../application/data/song-to-playlist.dto';

export type GetSongToPlaylistWhere = Partial<
  Pick<SongToPlaylist, 'id' | 'song_id' | 'playlist_id' | 'deleted_at'>
>;
