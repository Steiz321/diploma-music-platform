import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initApi, initDocs } from './app.initializer';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  initApi(app);
  initDocs(app);

  const configService = app.get(ConfigService);
  const port = configService.get('node.port');

  await app.listen(port, () =>
    console.log(`Server is running on port ${port}`),
  );
}

bootstrap();
