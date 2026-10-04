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
import { PRODUCER } from './enrichment/producer.constant';
import { SONG_UPLOADED_QUEUE } from './enrichment/song-uploaded.consumer';
import { EnrichmentModule } from './enrichment/enrichment.module';
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
        // models come from SequelizeModule.forFeature (incl. outbox / inbox)
        autoLoadModels: true,
        // the schema comes only from migrations
        synchronize: false,
      }),
    }),
    MessagingModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const rabbitmq = configService.get<RabbitMQConfig>('rabbitmq');
        return {
          producer: PRODUCER,
          // one song at a time: Groq allows 20 transcriptions per minute
          rabbitmq: { ...rabbitmq, prefetchCount: 1 },
          outbox: configService.get<OutboxOptions>('outbox'),
          consumerQueues: [SONG_UPLOADED_QUEUE],
        };
      },
    }),
    EnrichmentModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
