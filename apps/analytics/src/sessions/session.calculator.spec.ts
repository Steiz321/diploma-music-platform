import { createEnvelope, PlaybackEventType } from '@platform/contracts';
import {
  applyPlaybackEvent,
  PlaybackEvent,
  SessionState,
} from './session.calculator';

const T0 = Date.parse('2026-10-06T10:00:00.000Z');

/** event at T0 + `atSec` seconds with the player at `position` */
const ev = (
  type: PlaybackEventType,
  atSec: number,
  position: number,
  extra: Record<string, number> = {},
): PlaybackEvent =>
  createEnvelope(
    type,
    {
      play_id: 'play-1',
      song_id: 42,
      position_sec: position,
      duration_sec: 200,
      source: { type: 'feed' },
      ...extra,
    } as any,
    {
      producer: 'core',
      user_id: 5,
      occurred_at: new Date(T0 + atSec * 1000),
    },
  ) as PlaybackEvent;

const replay = (events: PlaybackEvent[]): SessionState =>
  events.reduce<SessionState | null>(
    (session, event) => applyPlaybackEvent(session, event),
    null,
  );

describe('applyPlaybackEvent', () => {
  it('counts the seconds heard between events of a playing track', () => {
    const session = replay([
      ev('playback.started', 0, 0),
      ev('playback.progress', 15, 15),
      ev('playback.progress', 30, 30),
    ]);

    expect(session).toMatchObject({
      user_id: 5,
      song_id: 42,
      listened_sec: 30,
      playing: true,
      started_at: new Date(T0),
      events_count: 3,
    });
  });

  it('does not count paused time', () => {
    const session = replay([
      ev('playback.started', 0, 0),
      ev('playback.paused', 10, 10),
      // 60 s of pause, then 5 s of playing
      ev('playback.resumed', 70, 10),
      ev('playback.progress', 75, 15),
    ]);

    expect(session.listened_sec).toBe(15);
  });

  it('does not count a seek forward as listening', () => {
    const session = replay([
      ev('playback.started', 0, 0),
      ev('playback.seeked', 5, 180, { from_sec: 5, to_sec: 180 }),
      ev('playback.completed', 25, 200),
    ]);

    // 5 s before the seek + 20 s after it
    expect(session).toMatchObject({
      listened_sec: 25,
      completed: true,
      max_position: 200,
    });
  });

  it('counts at most the wall time when a seek was not reported', () => {
    const session = replay([
      ev('playback.started', 0, 0),
      ev('playback.progress', 15, 120),
    ]);

    // position jumped 120 s in 15 s: only ~15 s (+ drift tolerance) count
    expect(session.listened_sec).toBe(17);
  });

  it('marks a skip in the first 30 s as early', () => {
    expect(
      replay([ev('playback.started', 0, 0), ev('playback.skipped', 12, 12)]),
    ).toMatchObject({ skipped: true, skipped_early: true, playing: false });
    expect(
      replay([ev('playback.started', 0, 0), ev('playback.skipped', 95, 95)]),
    ).toMatchObject({ skipped: true, skipped_early: false });
  });

  it('starts a session from any event when started was lost', () => {
    const session = replay([ev('playback.progress', 15, 15)]);

    expect(session).toMatchObject({ listened_sec: 0, playing: true });
    expect(
      applyPlaybackEvent(session, ev('playback.progress', 30, 30)),
    ).toMatchObject({
      listened_sec: 15,
    });
  });

  it('keeps the timeline of later events when an older event arrives', () => {
    const session = replay([
      ev('playback.started', 0, 0),
      ev('playback.progress', 30, 30),
      // late delivery of an event from t = 15
      ev('playback.progress', 15, 15),
    ]);

    expect(session).toMatchObject({
      listened_sec: 30,
      last_position: 30,
      last_event_at: new Date(T0 + 30_000),
    });
  });
});
