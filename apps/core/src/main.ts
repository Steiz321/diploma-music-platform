import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initApi, initDocs } from './app.initializer';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    // keep startup logs until the pino logger is attached
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  initApi(app);
  initDocs(app);

  const configService = app.get(ConfigService);
  const port = configService.get('node.port');

  await app.listen(port);
  app.get(Logger).log(`Server is running on port ${port}`, 'Bootstrap');
}

bootstrap();
