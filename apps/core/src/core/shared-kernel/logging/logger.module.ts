import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { resolveRequestId } from '../request-context/request-context.middleware';

/**
 * Structured JSON logs (pino). Every HTTP request gets an id from the
 * x-request-id header or a generated UUID; it is logged as req.id with every
 * line of the request and becomes correlation_id of the events it produces.
 */
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get<string>('node.logLevel'),
          genReqId: (req) => resolveRequestId(req as any),
          redact: ['req.headers.authorization', 'req.headers.cookie'],
          autoLogging: {
            // container healthcheck polls it every few seconds
            ignore: (req) => req.url?.startsWith('/health'),
          },
        },
      }),
    }),
  ],
})
export class LoggerModule {}
