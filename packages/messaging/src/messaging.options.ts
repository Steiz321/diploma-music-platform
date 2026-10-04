export interface OutboxOptions {
  /** how often the relay looks for unpublished events */
  relayIntervalMs: number;
  /** max events published per relay cycle */
  batchSize: number;
  /** published events older than this are deleted daily */
  retentionDays: number;
}

export interface MessagingOptions {
  /** `producer` of the events this service publishes, e.g. 'core' */
  producer: string;
  rabbitmq: {
    /** amqp://user:password@host:5672 */
    uri: string;
    /** how long a publish waits for the broker confirm */
    publishTimeoutMs: number;
    /** unacked messages per consumer; 1 for slow handlers */
    prefetchCount?: number;
  };
  outbox: OutboxOptions;
  /**
   * Queues this service consumes from. Each gets a dead-letter queue
   * `<queue>.dlq` bound to the dead-letter exchange with routing key `<queue>`.
   */
  consumerQueues?: string[];
}

export const MESSAGING_OPTIONS = Symbol.for('MessagingOptions');
