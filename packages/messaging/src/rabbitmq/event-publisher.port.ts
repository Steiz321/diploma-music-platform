import { EventEnvelope } from '@platform/contracts';

export interface EventPublisher {
  /**
   * Publishes the envelope to the events exchange with routing key = type.
   * Resolves only after the broker confirmed the message; rejects when the
   * broker is unreachable, nacks the message or does not answer in time.
   */
  publish(envelope: EventEnvelope): Promise<void>;

  isConnected(): boolean;
}

export const EventPublisherType = Symbol.for('EventPublisher');
