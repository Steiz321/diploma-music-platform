import { EventEnvelope, EventPayloadMap, EventType } from '@platform/contracts';
import { createEvent } from '@platform/messaging';
import { PRODUCER } from './producer.constant';

/**
 * Envelope of a domain event produced by Core. correlation_id is the id of
 * the current HTTP request (or consumed event), so it can be traced in logs.
 */
export const newEvent = <T extends EventType>(
  type: T,
  payload: EventPayloadMap[T],
  userId?: number,
): EventEnvelope<T, EventPayloadMap[T]> =>
  createEvent(PRODUCER, type, payload, userId);
