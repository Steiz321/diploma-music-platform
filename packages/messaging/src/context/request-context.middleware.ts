import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { RequestContext } from './request-context';

export const REQUEST_ID_HEADER = 'x-request-id';

/** Takes the request id from req.id (set by the HTTP logger) or x-request-id. */
export const resolveRequestId = (req: Request): string => {
  const header = req.headers[REQUEST_ID_HEADER];
  const fromHeader = Array.isArray(header) ? header[0] : header;
  return String((req as any).id ?? (fromHeader || randomUUID()));
};

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = resolveRequestId(req);
    (req as any).id = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);

    RequestContext.run({ requestId }, next);
  }
}
