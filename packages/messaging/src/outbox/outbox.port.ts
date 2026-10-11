import { Transaction } from 'sequelize';
import { EventEnvelope } from '@platform/contracts';

export interface OutboxAddOptions {
  // the transaction of the data change: the event is stored atomically with it
  transaction: Transaction;
  // entity the event is about, e.g. 'song' / 42
  aggregateType: string;
  aggregateId: string | number;
}

/**
 * Write side of the transactional outbox. Use cases call it explicitly inside
 * their own transaction (not from EventBus handlers, which run outside it).
 */
export interface OutboxEntry {
  envelope: EventEnvelope;
  aggregateType: string;
  aggregateId: string | number;
}

export interface OutboxPort {
  add(envelope: EventEnvelope, options: OutboxAddOptions): Promise<void>;

  /**
   * Stores many events in one statement. An event whose event_id is already
   * in the outbox is skipped (idempotent retries of client batches).
   * Returns how many were stored.
   */
  addMany(
    entries: OutboxEntry[],
    options: { transaction: Transaction },
  ): Promise<number>;
}

export const OutboxPortType = Symbol.for('OutboxPort');
