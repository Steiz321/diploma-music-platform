import React, { createContext, useContext, useState, ReactNode } from "react";
import type { PlaybackSource } from "../tracking";

export interface PlayerSong {
  id: number;
  name: string;
  author: string;
  audio: string;
  is_liked: boolean;
}

interface PlayerContextType {
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
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
};

const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [playlist, setPlaylist] = useState<PlayerSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentSong, setCurrentSong] = useState<PlayerSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playId, setPlayId] = useState<string | null>(null);
  const [source, setSource] = useState<PlaybackSource>({ type: "song_page" });

  // every switch of the track starts a new listening session
  const startTrack = (song: PlayerSong) => {
    setCurrentSong(song);
    setPlayId(crypto.randomUUID());
    setIsPlaying(true);
  };

  const playSong = (
    song: PlayerSong,
    newPlaylist?: PlayerSong[],
    index?: number,
    newSource?: PlaybackSource
  ) => {
    if (newPlaylist) {
      setPlaylist(newPlaylist);
      setCurrentIndex(index ?? newPlaylist.findIndex((s) => s.id === song.id));
    } else if (playlist.length > 0) {
      setCurrentIndex(playlist.findIndex((s) => s.id === song.id));
    } else {
      setPlaylist([song]);
      setCurrentIndex(0);
    }
    if (newSource) {
      setSource(newSource);
    }
    startTrack(song);
  };

  const playNext = () => {
    if (playlist.length === 0) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex < playlist.length) {
      setCurrentIndex(nextIndex);
      startTrack(playlist[nextIndex]);
    }
  };

  const playPrev = () => {
    if (playlist.length === 0) return;
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentIndex(prevIndex);
      startTrack(playlist[prevIndex]);
    }
  };

  const pause = () => setIsPlaying(false);
  const resume = () => setIsPlaying(true);

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        playSong,
        pause,
        resume,
        playNext,
        playPrev,
        playlist,
        currentIndex,
        hasNext: currentIndex >= 0 && currentIndex < playlist.length - 1,
        hasPrev: currentIndex > 0,
        playId,
        source,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerProvider;
