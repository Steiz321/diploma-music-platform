import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import config from './core/configuration/config';
import { PostgresConnectionModule } from './core/shared-kernel/secondary-adapters/postgres/postgres-connection.module';
import { CryptoModule } from './core/shared-kernel/secondary-adapters/crypto/crypto.module';
import { S3Module } from './core/shared-kernel/secondary-adapters/s3/s3.module';
import { RabbitMQConnectionModule } from './core/shared-kernel/secondary-adapters/rabbitmq/rabbitmq.module';
import { UserModule } from './core/components/user/user.module';
import { AuthModule } from './core/components/auth/auth.module';
import { CommentModule } from './core/components/comment/comment.module';
import { LikeModule } from './core/components/like/like.module';
import { SongModule } from './core/components/song/song.module';
import { OutboxModule } from './core/components/outbox/outbox.module';
import { HealthModule } from './core/components/health/health.module';
import { LoggerModule } from './core/shared-kernel/logging/logger.module';
import { RequestContextMiddleware } from './core/shared-kernel/request-context/request-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    LoggerModule,
    ScheduleModule.forRoot(),
    PostgresConnectionModule,
    CryptoModule,
    S3Module,
    RabbitMQConnectionModule,
    OutboxModule,
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
