import {
  MessageHandlerErrorBehavior,
  RabbitMQConfig,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { EventType, EXCHANGES } from '@platform/contracts';
import { MessagingOptions } from '../messaging.options';

export const deadLetterQueueName = (queue: string) => `${queue}.dlq`;

/** golevelup connection config built from the messaging options. */
export const buildRabbitMQConfig = (
  options: MessagingOptions,
): RabbitMQConfig => ({
  uri: options.rabbitmq.uri,
  prefetchCount: options.rabbitmq.prefetchCount ?? 10,
  // declared again on every (re)connect of the channel
  exchanges: [
    { name: EXCHANGES.events, type: 'topic', options: { durable: true } },
    { name: EXCHANGES.deadLetter, type: 'topic', options: { durable: true } },
  ],
  queues: (options.consumerQueues ?? []).map((queue) => ({
    name: deadLetterQueueName(queue),
    options: { durable: true },
    exchange: EXCHANGES.deadLetter,
    routingKey: queue,
  })),
  // no RPC between services
  enableDirectReplyTo: false,
  // a handler that throws rejects the message to the dead-letter queue
  // instead of requeueing it forever
  defaultSubscribeErrorBehavior: MessageHandlerErrorBehavior.NACK,
  // start even when the broker is down; the outbox relay retries
  connectionInitOptions: { wait: false },
});

/**
 * Subscribes a handler to event types on `platform.events` through a durable
 * queue of this service. Rejected messages go to `<queue>.dlq` via the
 * dead-letter exchange (list the queue in MessagingOptions.consumerQueues).
 */
export const SubscribeToEvents = (queue: string, types: EventType[]) =>
  RabbitSubscribe({
    exchange: EXCHANGES.events,
    routingKey: types,
    queue,
    queueOptions: {
      durable: true,
      deadLetterExchange: EXCHANGES.deadLetter,
      deadLetterRoutingKey: queue,
    },
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  });
