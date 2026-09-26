import React, { createContext, useContext, useState, ReactNode } from "react";

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
  playSong: (song: PlayerSong, playlist?: PlayerSong[], index?: number) => void;
  pause: () => void;
  resume: () => void;
  playNext: () => void;
  playPrev: () => void;
  playlist: PlayerSong[];
  currentIndex: number;
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

  const playSong = (
    song: PlayerSong,
    newPlaylist?: PlayerSong[],
    index?: number
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
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const playNext = () => {
    if (playlist.length === 0) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex < playlist.length) {
      setCurrentIndex(nextIndex);
      setCurrentSong(playlist[nextIndex]);
      setIsPlaying(true);
    }
  };

  const playPrev = () => {
    if (playlist.length === 0) return;
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentIndex(prevIndex);
      setCurrentSong(playlist[prevIndex]);
      setIsPlaying(true);
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
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerProvider;
