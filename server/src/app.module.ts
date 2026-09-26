import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import config from './core/configuration/config';
import { PostgresConnectionModule } from './core/shared-kernel/secondary-adapters/postgres/postgres-connection.module';
import { CryptoModule } from './core/shared-kernel/secondary-adapters/crypto/crypto.module';
import { S3Module } from './core/shared-kernel/secondary-adapters/s3/s3.module';
import { UserModule } from './core/components/user/user.module';
import { AuthModule } from './core/components/auth/auth.module';
import { CommentModule } from './core/components/comment/comment.module';
import { LikeModule } from './core/components/like/like.module';
import { SongModule } from './core/components/song/song.module';
import { LogRequestMiddleware } from './core/shared-kernel/rest/middleware/log-request.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    PostgresConnectionModule,
    CryptoModule,
    S3Module,
    UserModule,
    AuthModule,
    CommentModule,
    LikeModule,
    SongModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LogRequestMiddleware).forRoutes('*');
  }
}
