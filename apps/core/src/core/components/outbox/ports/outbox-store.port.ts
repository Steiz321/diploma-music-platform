import { Transaction } from 'sequelize';
import { OutboxEvent } from '../application/data/outbox-event.dto';

/** Read/update side of the outbox used by the relay. */
export interface OutboxStore {
  transaction<T>(work: (transaction: Transaction) => Promise<T>): Promise<T>;

  // unpublished events, oldest first, locked FOR UPDATE SKIP LOCKED
  lockUnpublishedBatch(
    limit: number,
    transaction: Transaction,
  ): Promise<OutboxEvent[]>;

  markPublished(id: string, transaction: Transaction): Promise<void>;

  // attempts += 1, last_error = error; the event stays unpublished
  markFailed(id: string, error: string, transaction: Transaction): Promise<void>;

  deletePublishedBefore(date: Date): Promise<number>;
}

export const OutboxStoreType = Symbol.for('OutboxStore');
