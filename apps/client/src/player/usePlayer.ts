import { createContext, useContext } from "react";
import type { PlaybackSource } from "../tracking";

export interface PlayerSong {
  id: number;
  name: string;
  author: string;
  audio: string;
  is_liked: boolean;
  /** shown in the bottom player; a colored square when missing */
  cover_url?: string;
}

export interface PlayerContextType {
  currentSong: PlayerSong | null;
  isPlaying: boolean;
  /** source: where the queue comes from (feed, a playlist, ...) for analytics */
  playSong: (
    song: PlayerSong,
    playlist?: PlayerSong[],
    index?: number,
    source?: PlaybackSource
  ) => void;
  pause: () => void;
  resume: () => void;
  playNext: () => void;
  playPrev: () => void;
  playlist: PlayerSong[];
  currentIndex: number;
  hasNext: boolean;
  hasPrev: boolean;
  /** a new id for every listening session of a track (for player events) */
  playId: string | null;
  source: PlaybackSource;
  /** moves the current track to a position (seconds); reported as a seek */
  seek: (seconds: number) => void;
  /** used by BottomPlayer, which owns the <audio> element */
  setProgress: (currentTime: number, duration?: number) => void;
  /** used by BottomPlayer: how to move its <audio> element (null on unmount) */
  registerSeek: (handler: ((seconds: number) => void) | null) => void;
}

export interface PlayerProgress {
  /** position of the current track in seconds (updated on "timeupdate") */
  currentTime: number;
  /** length of the current track in seconds, 0 until its metadata is loaded */
  duration: number;
}

export const PlayerContext = createContext<PlayerContextType | undefined>(
  undefined
);

// Kept apart from PlayerContext: it changes several times a second while
// playing, and only the bottom player and the lyrics need it.
export const PlayerProgressContext = createContext<PlayerProgress | undefined>(
  undefined
);

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
};

/** Position of the current track; re-renders on every "timeupdate". */
export const usePlayerProgress = () => {
  const ctx = useContext(PlayerProgressContext);
  if (!ctx)
    throw new Error("usePlayerProgress must be used within PlayerProvider");
  return ctx;
};
