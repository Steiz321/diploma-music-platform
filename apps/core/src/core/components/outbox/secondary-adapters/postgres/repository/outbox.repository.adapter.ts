import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op, Transaction } from 'sequelize';
import { EventEnvelope } from '@platform/contracts';
import OutboxEventModel from '../data/outbox-event.model';
import { OutboxAddOptions, OutboxPort } from '../../../ports/outbox.port';
import { OutboxStore } from '../../../ports/outbox-store.port';
import { OutboxEvent } from '../../../application/data/outbox-event.dto';

@Injectable()
export class OutboxRepositoryAdapter implements OutboxPort, OutboxStore {
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
