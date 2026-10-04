import { EventEnvelope } from '@platform/contracts';

export class OutboxEvent {
  id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: EventEnvelope;
  occurred_at: Date;
  published_at: Date | null;
  attempts: number;
  last_error: string | null;
}
