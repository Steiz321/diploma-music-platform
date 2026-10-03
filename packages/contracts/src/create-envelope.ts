import { randomUUID } from 'node:crypto';
import { EventEnvelope } from './envelope';
import { EventPayloadMap, EventType } from './events';

export interface EnvelopeMeta {
  producer: string;
  correlation_id?: string;
  user_id?: number;
  /** payload schema version, 1 by default */
  version?: number;
  /** defaults to now */
  occurred_at?: Date;
}

export function createEnvelope<T extends EventType>(
  type: T,
  payload: EventPayloadMap[T],
  meta: EnvelopeMeta,
): EventEnvelope<T, EventPayloadMap[T]> {
  const envelope: EventEnvelope<T, EventPayloadMap[T]> = {
    event_id: randomUUID(),
    type,
    version: meta.version ?? 1,
    occurred_at: (meta.occurred_at ?? new Date()).toISOString(),
    producer: meta.producer,
    payload,
  };

  // optional fields are omitted rather than serialized as null
  if (meta.correlation_id) envelope.correlation_id = meta.correlation_id;
  if (meta.user_id !== undefined) envelope.user_id = meta.user_id;

  return envelope;
}
