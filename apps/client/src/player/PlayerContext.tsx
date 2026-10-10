import { useCallback, useMemo, useRef, useState, ReactNode } from "react";
import type { PlaybackSource } from "../tracking";
import {
  PlayerContext,
  PlayerContextType,
  PlayerProgressContext,
  PlayerSong,
} from "./usePlayer";

export type { PlayerSong, PlayerProgress } from "./usePlayer";

const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [playlist, setPlaylist] = useState<PlayerSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentSong, setCurrentSong] = useState<PlayerSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playId, setPlayId] = useState<string | null>(null);
  const [source, setSource] = useState<PlaybackSource>({ type: "song_page" });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const seekHandler = useRef<((seconds: number) => void) | null>(null);

  const setProgress = useCallback((time: number, newDuration?: number) => {
    setCurrentTime(time);
    if (newDuration !== undefined) {
      setDuration(newDuration);
    }
  }, []);

  const registerSeek = useCallback(
    (handler: ((seconds: number) => void) | null) => {
      seekHandler.current = handler;
    },
    []
  );

  const seek = useCallback((seconds: number) => {
    seekHandler.current?.(seconds);
  }, []);

  // Memoized so that progress updates (a separate context) do not re-render
  // every usePlayer() consumer.
  const value = useMemo<PlayerContextType>(() => {
    // every switch of the track starts a new listening session
    const startTrack = (song: PlayerSong) => {
      setCurrentSong(song);
      setPlayId(crypto.randomUUID());
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(0);
    };

    const playSong = (
      song: PlayerSong,
      newPlaylist?: PlayerSong[],
      index?: number,
      newSource?: PlaybackSource
    ) => {
      if (newPlaylist) {
        setPlaylist(newPlaylist);
        setCurrentIndex(
          index ?? newPlaylist.findIndex((s) => s.id === song.id)
        );
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

    return {
      currentSong,
      isPlaying,
      playSong,
      pause: () => setIsPlaying(false),
      resume: () => setIsPlaying(true),
      playNext,
      playPrev,
      playlist,
      currentIndex,
      hasNext: currentIndex >= 0 && currentIndex < playlist.length - 1,
      hasPrev: currentIndex > 0,
      playId,
      source,
      seek,
      setProgress,
      registerSeek,
    };
  }, [
    currentSong,
    isPlaying,
    playlist,
    currentIndex,
    playId,
    source,
    seek,
    setProgress,
    registerSeek,
  ]);

  const progress = useMemo(
    () => ({ currentTime, duration }),
    [currentTime, duration]
  );

  return (
    <PlayerContext.Provider value={value}>
      <PlayerProgressContext.Provider value={progress}>
        {children}
      </PlayerProgressContext.Provider>
    </PlayerContext.Provider>
  );
};

export default PlayerProvider;
