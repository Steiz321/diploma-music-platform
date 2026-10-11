import { RefObject, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { tracker } from "../tracking";
import type { PlaybackEventType, PlaybackSource } from "../tracking";

const PROGRESS_INTERVAL_MS = 15_000;

interface Session {
  playId: string;
  songId: number;
  source: PlaybackSource;
  started: boolean;
  paused: boolean;
  ended: boolean;
  /** last known position: the audio element is already on the next track
      when a skip of the previous one is reported */
  position: number;
  duration: number | null;
}

interface Options {
  audioRef: RefObject<HTMLAudioElement | null>;
  playId: string | null;
  songId: number | null;
  source: PlaybackSource;
}

const round = (seconds: number) => Math.round(seconds * 10) / 10;

/**
 * Player events of the current listening session (one play_id per track):
 * started, progress every 15 s of playback, paused / resumed, seeked,
 * completed, and skipped when another track starts before the end.
 * Returns the handlers to wire to the <audio> element and the seek slider.
 */
export const usePlaybackTracking = ({
  audioRef,
  playId,
  songId,
  source,
}: Options) => {
  const session = useRef<Session | null>(null);
  const seekFrom = useRef<number | null>(null);

  const emit = useCallback(
    (
      type: PlaybackEventType,
      current: Session,
      extra: { from_sec?: number; to_sec?: number } = {}
    ) => {
      tracker.track({
        type,
        play_id: current.playId,
        song_id: current.songId,
        position_sec: round(current.position),
        duration_sec: current.duration === null ? null : round(current.duration),
        source: current.source,
        ...extra,
      });
    },
    []
  );

  const sync = useCallback(() => {
    const audio = audioRef.current;
    const current = session.current;
    if (!audio || !current) return;
    current.position = audio.currentTime;
    current.duration = Number.isFinite(audio.duration) ? audio.duration : null;
  }, [audioRef]);

  // A new play_id: the previous session ends here. Layout effect, so it runs
  // before the audio element reports events of the new track.
  useLayoutEffect(() => {
    const previous = session.current;
    if (previous && previous.started && !previous.ended) {
      emit("playback.skipped", previous);
    }

    session.current =
      playId && songId
        ? {
            playId,
            songId,
            source,
            started: false,
            paused: false,
            ended: false,
            position: 0,
            duration: null,
          }
        : null;
    seekFrom.current = null;
    // source belongs to the session it started with
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playId, songId, emit]);

  // progress while actually playing
  useEffect(() => {
    const timer = setInterval(() => {
      const audio = audioRef.current;
      const current = session.current;
      if (!audio || !current || !current.started || audio.paused) return;
      sync();
      emit("playback.progress", current);
    }, PROGRESS_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [audioRef, emit, sync]);

  const onPlaying = () => {
    const current = session.current;
    if (!current) return;
    sync();
    if (!current.started) {
      current.started = true;
      emit("playback.started", current);
    } else if (current.paused) {
      emit("playback.resumed", current);
    }
    current.paused = false;
  };

  const onPause = () => {
    const audio = audioRef.current;
    const current = session.current;
    // the element also pauses when it ends or loads another track
    if (!audio || !current || !current.started || audio.ended || current.paused)
      return;
    sync();
    current.paused = true;
    emit("playback.paused", current);
  };

  const onEnded = () => {
    const current = session.current;
    if (!current || current.ended) return;
    sync();
    current.ended = true;
    emit("playback.completed", current);
  };

  const onTimeUpdate = () => {
    // a seek in progress keeps the position from before the drag
    if (seekFrom.current === null) sync();
  };

  /** slider moves: remember where the drag started */
  const onSeekChange = () => {
    if (seekFrom.current === null) {
      sync();
      seekFrom.current = session.current?.position ?? 0;
    }
  };

  /** slider released: one seeked event per drag */
  const onSeekCommitted = (to: number) => {
    const current = session.current;
    const from = seekFrom.current;
    seekFrom.current = null;
    if (!current || from === null) return;
    current.position = to;
    if (current.started) {
      emit("playback.seeked", current, { from_sec: round(from), to_sec: round(to) });
    }
  };

  return {
    onPlaying,
    onPause,
    onEnded,
    onTimeUpdate,
    onSeekChange,
    onSeekCommitted,
  };
};
