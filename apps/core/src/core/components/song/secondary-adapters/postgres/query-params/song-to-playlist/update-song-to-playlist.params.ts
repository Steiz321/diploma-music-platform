import { SongToPlaylist } from '../../../../application/data/song-to-playlist.dto';

export type SongToPlaylistUpdateParams = Partial<
  Pick<SongToPlaylist, 'song_id' | 'playlist_id' | 'deleted_at'>
>;
