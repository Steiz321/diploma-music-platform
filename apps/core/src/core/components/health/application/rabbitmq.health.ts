import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import {
  EventPublisherInterface,
  EventPublisherInterfaceType,
} from 'src/core/shared-kernel/ports/event-publisher.interface';

@Injectable()
export class RabbitMQHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(EventPublisherInterfaceType)
    private readonly publisher: EventPublisherInterface,
  ) {}

  isConnected<const Key extends string>(key: Key) {
    const indicator = this.healthIndicatorService.check(key);
    return this.publisher.isConnected()
      ? indicator.up()
      : indicator.down({ message: 'not connected to the broker' });
  }
}
