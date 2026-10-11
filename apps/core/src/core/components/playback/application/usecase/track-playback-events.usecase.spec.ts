import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { OutboxPort, RequestContext } from '@platform/messaging';
import { PlaybackEventDto } from '../data/request/track-playback-events.request';
import TrackPlaybackEventsUseCase, {
  resolveOccurredAt,
} from './track-playback-events.usecase';

const TX = { id: 'tx' } as unknown as Transaction;

const event = (patch: Partial<PlaybackEventDto> = {}): PlaybackEventDto => ({
  event_id: '3f0c5a52-7c5e-4c4d-9d6e-2b8a4f3f9e11',
  type: 'playback.started',
  occurred_at: new Date(Date.now() - 5_000).toISOString(),
  play_id: 'b1a7d9a0-4b8e-4c3a-8f39-0b0c7f3c2d11',
  song_id: 42,
  position_sec: 0,
  duration_sec: 245.1,
  source: { type: 'playlist', id: 3 },
  ...patch,
});

describe('resolveOccurredAt', () => {
  const now = new Date('2026-10-05T12:00:00.000Z');

  it('keeps a plausible client time', () => {
    expect(resolveOccurredAt('2026-10-05T11:59:30.000Z', now)).toEqual(
      new Date('2026-10-05T11:59:30.000Z'),
    );
  });

  it('uses the server time for a clock far in the future or the past', () => {
    expect(resolveOccurredAt('2026-10-05T12:05:00.000Z', now)).toBe(now);
    expect(resolveOccurredAt('2026-10-03T12:00:00.000Z', now)).toBe(now);
  });
});

describe('TrackPlaybackEventsUseCase', () => {
  let outbox: jest.Mocked<OutboxPort>;
  let useCase: TrackPlaybackEventsUseCase;

  beforeEach(() => {
    outbox = {
      add: jest.fn(),
      addMany: jest.fn(async (entries, _options) => entries.length),
    };
    const sequelize = {
      transaction: jest.fn((work) => work(TX)),
    } as unknown as Sequelize;
    useCase = new TrackPlaybackEventsUseCase(sequelize, outbox);
  });

  it('writes one envelope per event in one transaction, user_id from the token', async () => {
    const seeked = event({
      event_id: '6c1f4b1e-2b1a-4a5e-9d1f-5a3b2c1d0e9f',
      type: 'playback.seeked',
      position_sec: 90,
      from_sec: 10,
      to_sec: 90,
      duration_sec: undefined,
      source: { type: 'feed' },
    });

    const result = await RequestContext.run({ requestId: 'req-7' }, () =>
      useCase.execute({ userId: 5, events: [event(), seeked] }),
    );

    expect(result).toEqual({ accepted: 2, duplicates: 0 });
    expect(outbox.addMany).toHaveBeenCalledTimes(1);
    const [entries, options] = outbox.addMany.mock.calls[0];
    expect(options).toEqual({ transaction: TX });
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      aggregateType: 'song',
      aggregateId: 42,
      envelope: {
        // the client's id: a retried batch is stored once
        event_id: '3f0c5a52-7c5e-4c4d-9d6e-2b8a4f3f9e11',
        type: 'playback.started',
        producer: 'core',
        user_id: 5,
        correlation_id: 'req-7',
        payload: {
          play_id: 'b1a7d9a0-4b8e-4c3a-8f39-0b0c7f3c2d11',
          song_id: 42,
          position_sec: 0,
          duration_sec: 245.1,
          source: { type: 'playlist', id: 3 },
        },
      },
    });
    expect(entries[1].envelope.payload).toEqual({
      play_id: 'b1a7d9a0-4b8e-4c3a-8f39-0b0c7f3c2d11',
      song_id: 42,
      position_sec: 90,
      duration_sec: null,
      source: { type: 'feed' },
      from_sec: 10,
      to_sec: 90,
    });
  });

  it('reports events that were already stored by an earlier attempt', async () => {
    outbox.addMany.mockResolvedValue(1);

    await expect(
      useCase.execute({ userId: 5, events: [event(), event()] }),
    ).resolves.toEqual({ accepted: 2, duplicates: 1 });
  });
});
