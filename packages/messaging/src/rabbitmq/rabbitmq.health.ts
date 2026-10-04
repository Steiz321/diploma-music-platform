import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { EventPublisher, EventPublisherType } from './event-publisher.port';

/** Terminus indicator: up while the service is connected to RabbitMQ. */
@Injectable()
export class RabbitMQHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(EventPublisherType)
    private readonly publisher: EventPublisher,
  ) {}

  isConnected<const Key extends string>(key: Key) {
    const indicator = this.healthIndicatorService.check(key);
    return this.publisher.isConnected()
      ? indicator.up()
      : indicator.down({ message: 'not connected to the broker' });
  }
}
