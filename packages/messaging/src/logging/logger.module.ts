import { DynamicModule, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { resolveRequestId } from '../context/request-context.middleware';
import { RequestContext } from '../context/request-context';

interface LoggerModuleAsyncOptions {
  inject?: any[];
  useFactory: (...args: any[]) => { level: string };
}

/**
 * Structured JSON logs (pino). Every HTTP request gets an id from the
 * x-request-id header or a generated UUID (req.id); every line logged inside a
 * request or a consumed message carries correlation_id.
 */
@Module({})
export class LoggerModule {
  static forRootAsync(options: LoggerModuleAsyncOptions): DynamicModule {
    return {
      module: LoggerModule,
      imports: [
        PinoLoggerModule.forRootAsync({
          inject: options.inject,
          useFactory: (...args: any[]) => ({
            pinoHttp: {
              level: options.useFactory(...args).level,
              genReqId: (req) => resolveRequestId(req as any),
              redact: ['req.headers.authorization', 'req.headers.cookie'],
              mixin: () => {
                const correlationId = RequestContext.requestId();
                return correlationId ? { correlation_id: correlationId } : {};
              },
              autoLogging: {
                // container healthchecks poll it every few seconds
                ignore: (req) => req.url?.startsWith('/health'),
              },
            },
          }),
        }),
      ],
    };
  }
}
