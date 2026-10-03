import {
  createEnvelope,
  EventEnvelope,
  EventPayloadMap,
  EventType,
} from '@platform/contracts';
import { RequestContext } from '../request-context/request-context';
import { PRODUCER } from './producer.constant';

/**
 * Envelope of a domain event produced by Core. correlation_id is the id of
 * the current HTTP request, so the event can be traced back to its logs.
 */
export const newEvent = <T extends EventType>(
  type: T,
  payload: EventPayloadMap[T],
  userId?: number,
): EventEnvelope<T, EventPayloadMap[T]> =>
  createEnvelope(type, payload, {
    producer: PRODUCER,
    correlation_id: RequestContext.requestId(),
    user_id: userId,
  });
