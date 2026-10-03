import { SongToPlaylist } from '../../../../application/data/song-to-playlist.dto';

export type SongToPlaylistCreateParams = Pick<
  SongToPlaylist,
  'song_id' | 'playlist_id'
>;
