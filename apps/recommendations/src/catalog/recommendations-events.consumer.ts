import { Injectable, Logger } from '@nestjs/common';
import {
  EVENT_TYPES,
  EventEnvelope,
  EventType,
  isFromExpectedProducer,
} from '@platform/contracts';
import { SubscribeToEvents, withEventContext } from '@platform/messaging';
import { CatalogService } from './catalog.service';

export const RECOMMENDATIONS_QUEUE = 'recommendations.events';

export const CONSUMED_EVENT_TYPES: EventType[] = [
  EVENT_TYPES.songUploaded,
  EVENT_TYPES.songEnriched,
  EVENT_TYPES.songDeleted,
  EVENT_TYPES.profileUpdated,
  EVENT_TYPES.scoresUpdated,
];

export const isValidRecommendationsEvent = (
  event: any,
): event is EventEnvelope =>
  typeof event?.event_id === 'string' &&
  CONSUMED_EVENT_TYPES.includes(event.type) &&
  isFromExpectedProducer(event) &&
  typeof event.occurred_at === 'string' &&
  (Number.isInteger(event.payload?.song_id) ||
    Number.isInteger(event.payload?.user_id));

@Injectable()
export class RecommendationsEventsConsumer {
  private readonly logger = new Logger(RecommendationsEventsConsumer.name);

  constructor(private readonly catalog: CatalogService) {}

  // a malformed message, a wrong producer or an unexpected error rejects it
  // to the DLQ
  @SubscribeToEvents(RECOMMENDATIONS_QUEUE, CONSUMED_EVENT_TYPES)
  async handle(event: EventEnvelope): Promise<void> {
    if (!isValidRecommendationsEvent(event)) {
      throw new Error(
        `Invalid recommendations message: ${JSON.stringify(event)?.slice(0, 300)}`,
      );
    }

    await withEventContext(event, async () => {
      const outcome = await this.catalog.apply(event);
      this.logger.debug(`${event.type} ${event.event_id}: ${outcome}`);
    });
  }
}
