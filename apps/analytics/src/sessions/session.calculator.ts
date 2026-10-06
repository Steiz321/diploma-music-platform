import {
  PlaybackEventType,
  PlaybackSource,
  PlatformEvent,
} from '@platform/contracts';

/** A skip before this position is a strong negative signal. */
export const EARLY_SKIP_SEC = 30;
// position may run a little ahead of the wall clock between two events
const DRIFT_TOLERANCE_SEC = 2;

/** One listening session of a track (one play_id). */
export interface SessionState {
  play_id: string;
  user_id: number;
  song_id: number;
  source: PlaybackSource;
  started_at: Date;
  last_event_at: Date;
  last_position: number;
  playing: boolean;
  /** seconds actually heard: seeks are not counted */
  listened_sec: number;
  max_position: number;
  duration_sec: number | null;
  completed: boolean;
  skipped: boolean;
  skipped_early: boolean;
  events_count: number;
}

export type PlaybackEvent = PlatformEvent<PlaybackEventType>;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const newSession = (event: PlaybackEvent, at: Date): SessionState => ({
  play_id: event.payload.play_id,
  user_id: event.user_id,
  song_id: event.payload.song_id,
  source: event.payload.source,
  started_at: at,
  last_event_at: at,
  last_position: event.payload.position_sec,
  playing: false,
  listened_sec: 0,
  max_position: event.payload.position_sec,
  duration_sec: event.payload.duration_sec,
  completed: false,
  skipped: false,
  skipped_early: false,
  events_count: 0,
});

/**
 * Applies a player event to its session. Listening time: between two events
 * of a playing track, the position change counts as heard only up to the wall
 * time that passed, so a seek forward (or a lost seeked event) does not count
 * as listening. A seek moves the reference point without counting the jump.
 * Events older than the last one only update the flags.
 */
export const applyPlaybackEvent = (
  state: SessionState | null,
  event: PlaybackEvent,
): SessionState => {
  const at = new Date(event.occurred_at);
  const { payload } = event;
  const session = state ? { ...state } : newSession(event, at);
  const inOrder = at >= session.last_event_at;
  const seeked = event.type === 'playback.seeked';
  // position right before this event (a seek starts where the track was)
  const positionBefore = seeked
    ? (payload as PlatformEvent<'playback.seeked'>['payload']).from_sec
    : payload.position_sec;

  if (state && inOrder && session.playing) {
    const wallSec = (at.getTime() - session.last_event_at.getTime()) / 1000;
    session.listened_sec += clamp(
      positionBefore - session.last_position,
      0,
      wallSec + DRIFT_TOLERANCE_SEC,
    );
  }

  switch (event.type) {
    case 'playback.started':
    case 'playback.progress':
    case 'playback.resumed':
      session.playing = true;
      break;
    case 'playback.paused':
      session.playing = false;
      break;
    case 'playback.completed':
      session.completed = true;
      session.playing = false;
      break;
    case 'playback.skipped':
      session.skipped = true;
      session.skipped_early =
        !session.completed && payload.position_sec < EARLY_SKIP_SEC;
      session.playing = false;
      break;
    case 'playback.seeked':
      break;
  }

  if (inOrder) {
    session.last_event_at = at;
    session.last_position = seeked
      ? (payload as PlatformEvent<'playback.seeked'>['payload']).to_sec
      : payload.position_sec;
  }

  session.max_position = Math.max(session.max_position, payload.position_sec);
  session.duration_sec = payload.duration_sec ?? session.duration_sec;
  if (session.duration_sec) {
    session.listened_sec = Math.min(session.listened_sec, session.duration_sec);
  }
  session.listened_sec = Math.round(session.listened_sec * 10) / 10;
  session.events_count += 1;

  return session;
};
