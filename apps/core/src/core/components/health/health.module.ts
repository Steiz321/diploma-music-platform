import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { RabbitMQHealthIndicator } from '@platform/messaging/health';
import { HealthController } from './primary-adapters/health.controller';

@Module({
  imports: [TerminusModule],
  providers: [RabbitMQHealthIndicator],
  controllers: [HealthController],
})
export class HealthModule {}
