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
import { RecommendationsRepository } from './common/recommendations.repository';
import { CatalogService } from './catalog/catalog.service';
import {
  RECOMMENDATIONS_QUEUE,
  RecommendationsEventsConsumer,
} from './catalog/recommendations-events.consumer';
import { RecommendationsService } from './api/recommendations.service';
import { RecommendationsController } from './api/recommendations.controller';
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
        // one message at a time: an older profile never overtakes a newer one
        rabbitmq: {
          ...configService.get<RabbitMQConfig>('rabbitmq'),
          prefetchCount: 1,
        },
        outbox: configService.get<OutboxOptions>('outbox'),
        consumerQueues: [RECOMMENDATIONS_QUEUE],
      }),
    }),
    HealthModule,
  ],
  providers: [
    RecommendationsRepository,
    CatalogService,
    RecommendationsEventsConsumer,
    RecommendationsService,
  ],
  controllers: [RecommendationsController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
