import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  SequelizeHealthIndicator,
} from '@nestjs/terminus';
import { RabbitMQHealthIndicator } from '@platform/messaging/health';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: SequelizeHealthIndicator,
    private readonly rabbitmq: RabbitMQHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Database and RabbitMQ connectivity; 503 when down',
  })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.rabbitmq.isConnected('rabbitmq'),
    ]);
  }
}
