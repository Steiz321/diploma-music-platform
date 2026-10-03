import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Transaction } from 'sequelize';
import { createEnvelope } from '@platform/contracts';
import { EventPublisherInterface } from 'src/core/shared-kernel/ports/event-publisher.interface';
import { OutboxConfig } from 'src/core/configuration/config.type';
import { OutboxStore } from '../ports/outbox-store.port';
import { OutboxEvent } from './data/outbox-event.dto';
import { OutboxRelay } from './outbox-relay.service';

const TRANSACTION = { id: 'tx' } as unknown as Transaction;
const CONFIG: OutboxConfig = {
  relayIntervalMs: 1000,
  batchSize: 100,
  retentionDays: 7,
};

const outboxEvent = (songId: number, occurredAt: string): OutboxEvent => {
  const envelope = createEnvelope(
    'song.liked',
    { song_id: songId, user_id: 1 },
    { producer: 'core', occurred_at: new Date(occurredAt) },
  );
  return {
    id: envelope.event_id,
    event_type: envelope.type,
    aggregate_type: 'song',
    aggregate_id: String(songId),
    payload: envelope,
    occurred_at: new Date(occurredAt),
    published_at: null,
    attempts: 0,
    last_error: null,
  };
};

describe('OutboxRelay', () => {
  let store: jest.Mocked<OutboxStore>;
  let publisher: jest.Mocked<EventPublisherInterface>;
  let relay: OutboxRelay;

  // the batch the store returns, already ordered by occurred_at like the SQL query
  const givenBatch = (events: OutboxEvent[]) =>
    store.lockUnpublishedBatch.mockResolvedValue(events);

  beforeAll(() => Logger.overrideLogger(false));

  beforeEach(() => {
    store = {
      transaction: jest.fn((work) => work(TRANSACTION)),
      lockUnpublishedBatch: jest.fn().mockResolvedValue([]),
      markPublished: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
      deletePublishedBefore: jest.fn().mockResolvedValue(0),
    } as jest.Mocked<OutboxStore>;
    publisher = {
      publish: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(true),
    };
    const configService = {
      get: jest.fn().mockReturnValue(CONFIG),
    } as unknown as ConfigService;

    relay = new OutboxRelay(
      store,
      publisher,
      {} as SchedulerRegistry,
      configService,
    );
  });

  it('publishes the batch and marks every event as published', async () => {
    const events = [
      outboxEvent(1, '2026-10-03T10:00:00Z'),
      outboxEvent(2, '2026-10-03T10:00:01Z'),
    ];
    givenBatch(events);

    const result = await relay.runCycle();

    expect(store.lockUnpublishedBatch).toHaveBeenCalledWith(
      CONFIG.batchSize,
      TRANSACTION,
    );
    expect(publisher.publish).toHaveBeenCalledTimes(2);
    expect(publisher.publish).toHaveBeenNthCalledWith(1, events[0].payload);
    expect(publisher.publish).toHaveBeenNthCalledWith(2, events[1].payload);
    expect(store.markPublished).toHaveBeenCalledWith(events[0].id, TRANSACTION);
    expect(store.markPublished).toHaveBeenCalledWith(events[1].id, TRANSACTION);
    expect(store.markFailed).not.toHaveBeenCalled();
    expect(result).toEqual({ published: 2, failed: 0 });
  });

  it('on a publish error increments attempts with last_error and does not mark the event', async () => {
    const [event] = [outboxEvent(1, '2026-10-03T10:00:00Z')];
    givenBatch([event]);
    publisher.publish.mockRejectedValueOnce(
      new Error('RabbitMQ is not connected'),
    );

    const result = await relay.runCycle();

    expect(store.markFailed).toHaveBeenCalledWith(
      event.id,
      'RabbitMQ is not connected',
      TRANSACTION,
    );
    expect(store.markPublished).not.toHaveBeenCalled();
    expect(result).toEqual({ published: 0, failed: 1 });
  });

  it('stops the batch at the first failure so later events keep their order', async () => {
    const events = [
      outboxEvent(1, '2026-10-03T10:00:00Z'),
      outboxEvent(2, '2026-10-03T10:00:01Z'),
      outboxEvent(3, '2026-10-03T10:00:02Z'),
    ];
    givenBatch(events);
    publisher.publish
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('timeout'));

    const result = await relay.runCycle();

    expect(publisher.publish).toHaveBeenCalledTimes(2);
    expect(store.markPublished).toHaveBeenCalledTimes(1);
    expect(store.markPublished).toHaveBeenCalledWith(events[0].id, TRANSACTION);
    expect(store.markFailed).toHaveBeenCalledWith(
      events[1].id,
      'timeout',
      TRANSACTION,
    );
    expect(result).toEqual({ published: 1, failed: 1 });
  });

  it('publishes events in occurred_at order and marks each right after its confirm', async () => {
    const events = [
      outboxEvent(1, '2026-10-03T10:00:00Z'),
      outboxEvent(2, '2026-10-03T10:00:01Z'),
      outboxEvent(3, '2026-10-03T10:00:02Z'),
    ];
    givenBatch(events);
    const calls: string[] = [];
    publisher.publish.mockImplementation(async (envelope) => {
      calls.push(`publish ${envelope.event_id}`);
    });
    store.markPublished.mockImplementation(async (id) => {
      calls.push(`mark ${id}`);
    });

    await relay.runCycle();

    expect(calls).toEqual(
      events.flatMap((event) => [`publish ${event.id}`, `mark ${event.id}`]),
    );
  });

  it('skips a cycle while the previous one is still running', async () => {
    let releaseBatch: (events: OutboxEvent[]) => void;
    store.lockUnpublishedBatch.mockReturnValueOnce(
      new Promise((resolve) => (releaseBatch = resolve)),
    );

    const first = relay.runCycle();
    const second = await relay.runCycle();
    releaseBatch([]);

    expect(second).toBeNull();
    await expect(first).resolves.toEqual({ published: 0, failed: 0 });
    expect(store.transaction).toHaveBeenCalledTimes(1);
  });

  it('does not throw when the cycle itself fails (e.g. database down)', async () => {
    store.transaction.mockRejectedValueOnce(new Error('connection refused'));

    await expect(relay.runCycle()).resolves.toEqual({
      published: 0,
      failed: 0,
    });
    // the next cycle runs normally
    await expect(relay.runCycle()).resolves.toEqual({
      published: 0,
      failed: 0,
    });
  });
});
