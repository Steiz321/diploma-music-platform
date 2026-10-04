import { Inject, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EventEnvelope, EXCHANGES } from '@platform/contracts';
import { EventPublisher } from './event-publisher.port';
import { MESSAGING_OPTIONS, MessagingOptions } from '../messaging.options';

@Injectable()
export class RabbitMQEventPublisher implements EventPublisher {
  private readonly publishTimeoutMs: number;

  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Inject(MESSAGING_OPTIONS) options: MessagingOptions,
  ) {
    this.publishTimeoutMs = options.rabbitmq.publishTimeoutMs;
  }

  isConnected(): boolean {
    return this.amqpConnection.connected;
  }

  async publish(envelope: EventEnvelope): Promise<void> {
    // While disconnected, amqp-connection-manager keeps messages in memory
    // until it reconnects; fail fast instead so the outbox counts an attempt.
    if (!this.isConnected()) {
      throw new Error('RabbitMQ is not connected');
    }

    // The channel is a confirm channel (amqp-connection-manager default), so
    // the promise resolves on the broker ack and rejects on nack or timeout.
    await this.amqpConnection.publish(
      EXCHANGES.events,
      envelope.type,
      envelope,
      {
        persistent: true,
        contentType: 'application/json',
        messageId: envelope.event_id,
        type: envelope.type,
        appId: envelope.producer,
        timestamp: Math.floor(Date.parse(envelope.occurred_at) / 1000),
        headers: envelope.correlation_id
          ? { correlation_id: envelope.correlation_id }
          : {},
        // amqp-connection-manager option: reject when not confirmed in time
        timeout: this.publishTimeoutMs,
      } as Parameters<AmqpConnection['publish']>[3],
    );
  }
}
