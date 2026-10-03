import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { RabbitMQConnectionModule } from 'src/core/shared-kernel/secondary-adapters/rabbitmq/rabbitmq.module';
import { HealthController } from './primary-adapters/health.controller';
import { RabbitMQHealthIndicator } from './application/rabbitmq.health';

@Module({
  imports: [TerminusModule, RabbitMQConnectionModule],
  providers: [RabbitMQHealthIndicator],
  controllers: [HealthController],
})
export class HealthModule {}
