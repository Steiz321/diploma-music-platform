import { Injectable, Logger } from '@nestjs/common';
import {
  EVENT_TYPES,
  EventEnvelope,
  EventType,
  isFromExpectedProducer,
  PLAYBACK_EVENT_TYPES,
} from '@platform/contracts';
import { SubscribeToEvents, withEventContext } from '@platform/messaging';
import { IngestionService } from './ingestion.service';

export const ANALYTICS_QUEUE = 'analytics.events';

export const CONSUMED_EVENT_TYPES: EventType[] = [
  ...PLAYBACK_EVENT_TYPES,
  EVENT_TYPES.songLiked,
  EVENT_TYPES.songUnliked,
  EVENT_TYPES.playlistSongAdded,
  EVENT_TYPES.playlistSongRemoved,
  EVENT_TYPES.songUploaded,
  EVENT_TYPES.songEnriched,
  EVENT_TYPES.songDeleted,
];

// user_id of likes, playlists and player events is trusted only from Core
export const isValidAnalyticsEvent = (event: any): event is EventEnvelope =>
  typeof event?.event_id === 'string' &&
  CONSUMED_EVENT_TYPES.includes(event.type) &&
  isFromExpectedProducer(event) &&
  typeof event.occurred_at === 'string' &&
  Number.isInteger(event.payload?.song_id);

@Injectable()
export class AnalyticsEventsConsumer {
  private readonly logger = new Logger(AnalyticsEventsConsumer.name);

  constructor(private readonly ingestion: IngestionService) {}

  // a malformed message, a wrong producer or an unexpected error rejects it
  // to the DLQ (kept there for inspection)
  @SubscribeToEvents(ANALYTICS_QUEUE, CONSUMED_EVENT_TYPES)
  async handle(event: EventEnvelope): Promise<void> {
    if (!isValidAnalyticsEvent(event)) {
      throw new Error(
        `Invalid analytics message: ${JSON.stringify(event)?.slice(0, 300)}`,
      );
    }

    await withEventContext(event, async () => {
      const outcome = await this.ingestion.ingest(event);
      this.logger.debug(`${event.type} ${event.event_id}: ${outcome}`);
    });
  }
}
