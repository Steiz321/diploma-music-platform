import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SequelizeModule, SequelizeModuleOptions } from '@nestjs/sequelize';
import {
  LoggerModule,
  MessagingModule,
  OutboxOptions,
  RequestContextMiddleware,
} from '@platform/messaging';
import configure from './config/config';
import { RabbitMQConfig } from './config/config.type';
import { PRODUCER } from './common/producer.constant';
import { AnalyticsRepository } from './common/analytics.repository';
import {
  ANALYTICS_QUEUE,
  AnalyticsEventsConsumer,
} from './ingestion/analytics-events.consumer';
import { IngestionService } from './ingestion/ingestion.service';
import { ProfileJob } from './profiles/profile.job';
import { ProfilesController } from './profiles/profiles.controller';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configure] }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        level: configService.get<string>('node.logLevel'),
      }),
    }),
    ScheduleModule.forRoot(),
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get<SequelizeModuleOptions>('db'),
        // outbox / inbox models of @platform/messaging; the rest is raw SQL
        autoLoadModels: true,
        // the schema comes only from migrations
        synchronize: false,
      }),
    }),
    MessagingModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        producer: PRODUCER,
        // one message at a time: events of a session are applied in order
        rabbitmq: {
          ...configService.get<RabbitMQConfig>('rabbitmq'),
          prefetchCount: 1,
        },
        outbox: configService.get<OutboxOptions>('outbox'),
        consumerQueues: [ANALYTICS_QUEUE],
      }),
    }),
    HealthModule,
  ],
  providers: [
    AnalyticsRepository,
    IngestionService,
    AnalyticsEventsConsumer,
    ProfileJob,
  ],
  controllers: [ProfilesController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
