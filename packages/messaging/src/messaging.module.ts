import { DynamicModule, Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import OutboxEventModel from './outbox/outbox-event.model';
import { OutboxRepository } from './outbox/outbox.repository';
import { OutboxPortType } from './outbox/outbox.port';
import { OutboxStoreType } from './outbox/outbox-store.port';
import { OutboxRelay } from './outbox/outbox-relay.service';
import ProcessedEventModel from './inbox/processed-event.model';
import { InboxService } from './inbox/inbox.service';
import { EventPublisherType } from './rabbitmq/event-publisher.port';
import { RabbitMQEventPublisher } from './rabbitmq/rabbitmq-event-publisher';
import { buildRabbitMQConfig } from './rabbitmq/rabbitmq-options';
import { MESSAGING_OPTIONS, MessagingOptions } from './messaging.options';

/**
 * Sequelize models of the package. Register them in the service's Sequelize
 * instance (they are not found by a models glob of the app).
 */
export const MESSAGING_MODELS = [OutboxEventModel, ProcessedEventModel];

interface MessagingModuleAsyncOptions {
  inject?: any[];
  useFactory: (...args: any[]) => MessagingOptions;
}

/**
 * RabbitMQ connection, transactional outbox with its relay, inbox and the
 * event publisher. Global: use cases inject OutboxPortType / InboxService.
 * Requires ScheduleModule.forRoot() and a SequelizeModule connection.
 */
@Global()
@Module({})
export class MessagingModule {
  static forRootAsync(options: MessagingModuleAsyncOptions): DynamicModule {
    return {
      module: MessagingModule,
      imports: [
        SequelizeModule.forFeature(MESSAGING_MODELS),
        RabbitMQModule.forRootAsync({
          inject: options.inject,
          useFactory: (...args: any[]) =>
            buildRabbitMQConfig(options.useFactory(...args)),
        }),
      ],
      providers: [
        {
          provide: MESSAGING_OPTIONS,
          inject: options.inject,
          useFactory: options.useFactory,
        },
        OutboxRepository,
        { provide: OutboxPortType, useExisting: OutboxRepository },
        { provide: OutboxStoreType, useExisting: OutboxRepository },
        OutboxRelay,
        InboxService,
        { provide: EventPublisherType, useClass: RabbitMQEventPublisher },
      ],
      exports: [
        MESSAGING_OPTIONS,
        OutboxPortType,
        InboxService,
        EventPublisherType,
        RabbitMQModule,
      ],
    };
  }
}
