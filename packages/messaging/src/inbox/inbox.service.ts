import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes, Transaction } from 'sequelize';
import ProcessedEventModel from './processed-event.model';

export type InboxResult<T> =
  | { processed: true; result: T }
  | { processed: false };

/**
 * Idempotent consumers: RabbitMQ delivers at least once, so every consumed
 * event_id is recorded in processed_events in the same transaction as the
 * changes it causes.
 */
@Injectable()
export class InboxService {
  constructor(
    @InjectModel(ProcessedEventModel)
    private readonly processedEventModel: typeof ProcessedEventModel,
    private readonly sequelize: Sequelize,
  ) {}

  async isProcessed(eventId: string): Promise<boolean> {
    const count = await this.processedEventModel.count({
      where: { event_id: eventId },
    });
    return count > 0;
  }

  /**
   * Records the event inside `transaction`. Returns false when it was already
   * recorded; a concurrent duplicate waits for the first transaction.
   */
  async markProcessed(
    eventId: string,
    transaction: Transaction,
  ): Promise<boolean> {
    const inserted = await this.sequelize.query(
      `INSERT INTO processed_events (event_id) VALUES (:eventId)
       ON CONFLICT (event_id) DO NOTHING
       RETURNING event_id`,
      { replacements: { eventId }, transaction, type: QueryTypes.SELECT },
    );
    return inserted.length > 0;
  }

  /** Runs `work` once per event: skipped when the event was already handled. */
  runOnce<T>(
    eventId: string,
    work: (transaction: Transaction) => Promise<T>,
  ): Promise<InboxResult<T>> {
    return this.sequelize.transaction(async (transaction) => {
      if (!(await this.markProcessed(eventId, transaction))) {
        return { processed: false } as const;
      }
      return { processed: true, result: await work(transaction) } as const;
    });
  }
}
