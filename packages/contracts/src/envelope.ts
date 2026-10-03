/**
 * Common wrapper of every event published to the broker.
 * The payload schema of each type is versioned separately by `version`.
 */
export interface EventEnvelope<TType extends string = string, TPayload = unknown> {
  /** UUID v4, also the AMQP messageId and the outbox primary key */
  event_id: string;
  /** equals the routing key, e.g. 'song.uploaded' */
  type: TType;
  /** version of the payload schema, starts at 1 */
  version: number;
  /** ISO 8601 */
  occurred_at: string;
  /** service that produced the event: 'core', 'ai-enrichment', ... */
  producer: string;
  /** request id of the HTTP request that caused the event */
  correlation_id?: string;
  /** user who caused the event, when there is one */
  user_id?: number;
  payload: TPayload;
}
