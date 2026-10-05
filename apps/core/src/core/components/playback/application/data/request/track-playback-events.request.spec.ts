import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TrackPlaybackEventsRequest } from './track-playback-events.request';

const event = (patch: Record<string, unknown> = {}) => ({
  event_id: '3f0c5a52-7c5e-4c4d-9d6e-2b8a4f3f9e11',
  type: 'playback.started',
  occurred_at: '2026-10-05T10:00:00.000Z',
  play_id: 'b1a7d9a0-4b8e-4c3a-8f39-0b0c7f3c2d11',
  song_id: 42,
  position_sec: 0,
  duration_sec: 245.1,
  source: { type: 'playlist', id: 3 },
  ...patch,
});

/** property paths of the validation errors, e.g. "events.0.type" */
const errorsOf = async (body: unknown): Promise<string[]> => {
  const errors = await validate(
    plainToInstance(TrackPlaybackEventsRequest, body),
  );
  const paths: string[] = [];
  const walk = (list: typeof errors, prefix: string) =>
    list.forEach((error) => {
      const path = prefix ? `${prefix}.${error.property}` : error.property;
      if (error.constraints) paths.push(path);
      walk(error.children ?? [], path);
    });
  walk(errors, '');
  return paths;
};

describe('TrackPlaybackEventsRequest', () => {
  it('accepts a valid batch', async () => {
    await expect(
      errorsOf({
        events: [
          event(),
          event({
            type: 'playback.seeked',
            event_id: '6c1f4b1e-2b1a-4a5e-9d1f-5a3b2c1d0e9f',
            from_sec: 10,
            to_sec: 90,
            duration_sec: null,
            source: { type: 'feed' },
          }),
        ],
      }),
    ).resolves.toEqual([]);
  });

  it('rejects an empty batch and a batch over 50 events', async () => {
    await expect(errorsOf({ events: [] })).resolves.toEqual(['events']);
    await expect(
      errorsOf({ events: Array.from({ length: 51 }, () => event()) }),
    ).resolves.toEqual(['events']);
  });

  it('rejects unknown types and sources, bad ids, negative positions', async () => {
    await expect(
      errorsOf({
        events: [
          event({
            type: 'playback.liked',
            event_id: 'not-a-uuid',
            song_id: 0,
            position_sec: -1,
            source: { type: 'radio' },
          }),
        ],
      }),
    ).resolves.toEqual(
      expect.arrayContaining([
        'events.0.type',
        'events.0.event_id',
        'events.0.song_id',
        'events.0.position_sec',
        'events.0.source.type',
      ]),
    );
  });

  it('requires from_sec and to_sec for playback.seeked only', async () => {
    await expect(
      errorsOf({ events: [event({ type: 'playback.seeked' })] }),
    ).resolves.toEqual(['events.0.from_sec', 'events.0.to_sec']);
    await expect(
      errorsOf({ events: [event({ type: 'playback.paused' })] }),
    ).resolves.toEqual([]);
  });
});
