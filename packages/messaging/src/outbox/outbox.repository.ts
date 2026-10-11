import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op, QueryTypes, Transaction } from 'sequelize';
import { EventEnvelope } from '@platform/contracts';
import OutboxEventModel from './outbox-event.model';
import { OutboxAddOptions, OutboxEntry, OutboxPort } from './outbox.port';
import { OutboxStore } from './outbox-store.port';
import { OutboxEvent } from './outbox-event.dto';

@Injectable()
export class OutboxRepository implements OutboxPort, OutboxStore {
  constructor(
    @InjectModel(OutboxEventModel)
    private readonly outboxEventModel: typeof OutboxEventModel,
    private readonly sequelize: Sequelize,
  ) {}

  async add(
    envelope: EventEnvelope,
    { transaction, aggregateType, aggregateId }: OutboxAddOptions,
  ): Promise<void> {
    await this.outboxEventModel.create(
      {
        id: envelope.event_id,
        event_type: envelope.type,
        aggregate_type: aggregateType,
        aggregate_id: String(aggregateId),
        payload: envelope,
        occurred_at: new Date(envelope.occurred_at),
      },
      { transaction },
    );
  }

  async addMany(
    entries: OutboxEntry[],
    { transaction }: { transaction: Transaction },
  ): Promise<number> {
    if (entries.length === 0) {
      return 0;
    }

    const replacements: Record<string, unknown> = {};
    const rows = entries.map(({ envelope, aggregateType, aggregateId }, i) => {
      replacements[`id${i}`] = envelope.event_id;
      replacements[`type${i}`] = envelope.type;
      replacements[`aggregateType${i}`] = aggregateType;
      replacements[`aggregateId${i}`] = String(aggregateId);
      replacements[`payload${i}`] = JSON.stringify(envelope);
      replacements[`occurredAt${i}`] = envelope.occurred_at;
      return `(:id${i}, :type${i}, :aggregateType${i}, :aggregateId${i}, CAST(:payload${i} AS jsonb), :occurredAt${i})`;
    });

    // RETURNING lists only the inserted rows, duplicates are skipped
    const inserted = await this.sequelize.query(
      `INSERT INTO outbox_events
         (id, event_type, aggregate_type, aggregate_id, payload, occurred_at)
       VALUES ${rows.join(', ')}
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      { replacements, transaction, type: QueryTypes.SELECT },
    );
    return inserted.length;
  }

  transaction<T>(work: (transaction: Transaction) => Promise<T>): Promise<T> {
    return this.sequelize.transaction(work);
  }

  async lockUnpublishedBatch(
    limit: number,
    transaction: Transaction,
  ): Promise<OutboxEvent[]> {
    const events = await this.outboxEventModel.findAll({
      where: { published_at: null },
      order: [['occurred_at', 'ASC']],
      limit,
      transaction,
      lock: transaction.LOCK.UPDATE,
      skipLocked: true,
    });
    return events.map((event) => event.toJSON());
  }

  async markPublished(id: string, transaction: Transaction): Promise<void> {
    await this.outboxEventModel.update(
      { published_at: Sequelize.fn('now') as unknown as Date },
      { where: { id }, transaction },
    );
  }

  async markFailed(
    id: string,
    error: string,
    transaction: Transaction,
  ): Promise<void> {
    await this.outboxEventModel.update(
      {
        attempts: Sequelize.literal('attempts + 1') as unknown as number,
        last_error: error,
      },
      { where: { id }, transaction },
    );
  }

  async deletePublishedBefore(date: Date): Promise<number> {
    return this.outboxEventModel.destroy({
      where: { published_at: { [Op.lt]: date } },
    });
  }
}
