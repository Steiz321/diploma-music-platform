import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import OutboxEventModel from './outbox-event.model';
import { OutboxRepository } from './outbox.repository';

describe('OutboxRepository.lockUnpublishedBatch', () => {
  it('locks the oldest unpublished events, skipping rows locked by another relay', async () => {
    const findAll = jest.fn().mockResolvedValue([]);
    const model = { findAll } as unknown as typeof OutboxEventModel;
    const adapter = new OutboxRepository(model, {} as Sequelize);
    const transaction = {
      LOCK: { UPDATE: 'UPDATE' },
    } as unknown as Transaction;

    await adapter.lockUnpublishedBatch(100, transaction);

    expect(findAll).toHaveBeenCalledWith({
      where: { published_at: null },
      order: [['occurred_at', 'ASC']],
      limit: 100,
      transaction,
      lock: 'UPDATE',
      skipLocked: true,
    });
  });
});
