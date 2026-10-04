import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  const port = app.get(ConfigService).get<number>('node.port');
  await app.listen(port);
  app.get(Logger).log(`AI enrichment is running on port ${port}`, 'Bootstrap');
}

bootstrap();
