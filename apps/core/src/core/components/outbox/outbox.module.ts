import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import OutboxEventModel from './secondary-adapters/postgres/data/outbox-event.model';
import { OutboxRepositoryAdapter } from './secondary-adapters/postgres/repository/outbox.repository.adapter';
import { OutboxPortType } from './ports/outbox.port';
import { OutboxStoreType } from './ports/outbox-store.port';
import { OutboxRelay } from './application/outbox-relay.service';
import { RabbitMQConnectionModule } from 'src/core/shared-kernel/secondary-adapters/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    SequelizeModule.forFeature([OutboxEventModel]),
    RabbitMQConnectionModule,
  ],
  providers: [
    OutboxRepositoryAdapter,
    { provide: OutboxPortType, useExisting: OutboxRepositoryAdapter },
    { provide: OutboxStoreType, useExisting: OutboxRepositoryAdapter },
    OutboxRelay,
  ],
  exports: [OutboxPortType],
})
export class OutboxModule {}
