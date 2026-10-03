import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { EXCHANGES } from '@platform/contracts';
import { RabbitMQConfig } from 'src/core/configuration/config.type';
import { EventPublisherInterfaceType } from '../../ports/event-publisher.interface';
import { RabbitMQEventPublisher } from './rabbitmq-event-publisher';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const { uri } = configService.get<RabbitMQConfig>('rabbitmq');
        return {
          uri,
          // declared again on every (re)connect of the channel
          exchanges: [
            {
              name: EXCHANGES.events,
              type: 'topic',
              options: { durable: true },
            },
            {
              name: EXCHANGES.deadLetter,
              type: 'topic',
              options: { durable: true },
            },
          ],
          // Core only publishes: no RPC reply queue
          enableDirectReplyTo: false,
          // start even when the broker is down; the outbox relay retries
          connectionInitOptions: { wait: false },
        };
      },
    }),
  ],
  providers: [
    {
      provide: EventPublisherInterfaceType,
      useClass: RabbitMQEventPublisher,
    },
  ],
  exports: [EventPublisherInterfaceType, RabbitMQModule],
})
export class RabbitMQConnectionModule {}
