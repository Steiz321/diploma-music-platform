import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  SequelizeHealthIndicator,
} from '@nestjs/terminus';
import { RabbitMQHealthIndicator } from '@platform/messaging/health';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: SequelizeHealthIndicator,
    private readonly rabbitmq: RabbitMQHealthIndicator,
  ) {}

  /** Database and RabbitMQ connectivity; 503 when down. */
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.rabbitmq.isConnected('rabbitmq'),
    ]);
  }
}
