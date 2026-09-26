import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as basicAuth from 'express-basic-auth';

import { ConfigService } from '@nestjs/config';
import { SwaggerConfig } from './core/configuration/config.type';
import { SwitchableValidationPipe } from './core/shared-kernel/pipe/switchable-validation.pipe';
import ApiResponseInterceptor from './core/shared-kernel/rest/general/api-response.interceptor';
import { FinalExceptionFilter } from './core/shared-kernel/rest/general/final-exception.filter';

export function initApi(app: NestExpressApplication) {
  app.enableCors();
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  app.useGlobalFilters(new FinalExceptionFilter());
  app.useGlobalPipes(
    new SwitchableValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
}

export function initDocs(app: NestExpressApplication) {
  const DOCS_UI_PATH = 'docs';

  const documentationBuilder = new DocumentBuilder();

  const options = documentationBuilder
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Login by username/password',
    })
    .setDescription('Dfundament Diploma API documentation')
    .setVersion('1.0.0')
    .setTitle('Dfundament Diploma API')
    .build();

  const swaggerDocumentation = SwaggerModule.createDocument(app, options);

  const configService = app.get(ConfigService);
  const swaggerCreds = configService.get<SwaggerConfig>('swagger');

  if (swaggerCreds.username) {
    app.use(
      `/${DOCS_UI_PATH}`,
      basicAuth({
        users: {
          [swaggerCreds.username]: swaggerCreds.password,
        },
        challenge: true,
      }),
    );
  }

  SwaggerModule.setup(DOCS_UI_PATH, app, swaggerDocumentation);
}
