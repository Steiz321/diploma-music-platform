import {
  createEnvelope,
  EventEnvelope,
  EventPayloadMap,
  EventType,
} from '@platform/contracts';
import { RequestContext } from './request-context';

/**
 * Envelope of a domain event; correlation_id is the id of the current HTTP
 * request or of the consumed event, so it can be traced across services.
 */
export const createEvent = <T extends EventType>(
  producer: string,
  type: T,
  payload: EventPayloadMap[T],
  userId?: number,
): EventEnvelope<T, EventPayloadMap[T]> =>
  createEnvelope(type, payload, {
    producer,
    correlation_id: RequestContext.requestId(),
    user_id: userId,
  });
