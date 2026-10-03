import {Injectable, Logger, NestMiddleware} from '@nestjs/common';
import {Request, Response, NextFunction} from 'express';

@Injectable()
export class LogRequestMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const {ip, method, originalUrl} = request;
    const requestStartTime = Date.now();

    response.on('finish', () => {
      const {statusCode} = response;
      const contentLength = response.get('content-length');
      const responseTime = Date.now() - requestStartTime;
      this.logger.log(
        `${ip} - - [${new Date().toUTCString()}] "${method} ${originalUrl}" ${statusCode} ${contentLength} ${responseTime}`
      );
    });

    next();
  }
}
