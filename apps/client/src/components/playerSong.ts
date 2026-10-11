import type { Song } from "../api/song";
import type { PlayerSong } from "../player/usePlayer";

/** A song from the API as the player queue expects it */
export const toPlayerSong = (song: Song): PlayerSong => ({
  id: song.id,
  name: song.name,
  author: song.user.username,
  audio: song.audio,
  is_liked: song.is_liked,
  cover_url: song.cover_url || undefined,
});
