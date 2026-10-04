import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  LoggerModule,
  MessagingModule,
  RequestContextMiddleware,
} from '@platform/messaging';
import config from './core/configuration/config';
import { OutboxConfig, RabbitMQConfig } from './core/configuration/config.type';
import { PRODUCER } from './core/shared-kernel/events/producer.constant';
import { PostgresConnectionModule } from './core/shared-kernel/secondary-adapters/postgres/postgres-connection.module';
import { CryptoModule } from './core/shared-kernel/secondary-adapters/crypto/crypto.module';
import { S3Module } from './core/shared-kernel/secondary-adapters/s3/s3.module';
import { UserModule } from './core/components/user/user.module';
import { AuthModule } from './core/components/auth/auth.module';
import { CommentModule } from './core/components/comment/comment.module';
import { LikeModule } from './core/components/like/like.module';
import { SongModule } from './core/components/song/song.module';
import { SONG_ENRICHMENT_QUEUE } from './core/components/song/primary-adapters/song-enrichment.consumer';
import { HealthModule } from './core/components/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        level: configService.get<string>('node.logLevel'),
      }),
    }),
    ScheduleModule.forRoot(),
    PostgresConnectionModule,
    // RabbitMQ, transactional outbox + relay, inbox (global)
    MessagingModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        producer: PRODUCER,
        rabbitmq: configService.get<RabbitMQConfig>('rabbitmq'),
        outbox: configService.get<OutboxConfig>('outbox'),
        consumerQueues: [SONG_ENRICHMENT_QUEUE],
      }),
    }),
    CryptoModule,
    S3Module,
    UserModule,
    AuthModule,
    CommentModule,
    LikeModule,
    SongModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
