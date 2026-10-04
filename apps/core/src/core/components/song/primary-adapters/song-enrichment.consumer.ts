import { Injectable, Logger } from '@nestjs/common';
import { EVENT_TYPES } from '@platform/contracts';
import { SubscribeToEvents, withEventContext } from '@platform/messaging';
import ApplySongEnrichmentUseCase, {
  SongEnrichmentEvent,
} from '../application/usecase/apply-song-enrichment.usecase';

export const SONG_ENRICHMENT_QUEUE = 'core.song-enrichment';

const isSongEnrichmentEvent = (event: any): event is SongEnrichmentEvent =>
  (event?.type === EVENT_TYPES.songEnriched ||
    event?.type === EVENT_TYPES.songEnrichmentFailed) &&
  typeof event.event_id === 'string' &&
  Number.isInteger(event.payload?.song_id);

/** Results of the AI enrichment service (song.enriched / song.enrichment_failed). */
@Injectable()
export class SongEnrichmentConsumer {
  private readonly logger = new Logger(SongEnrichmentConsumer.name);

  constructor(
    private readonly applySongEnrichmentUseCase: ApplySongEnrichmentUseCase,
  ) {}

  // a malformed message or an unexpected error rejects it to the DLQ
  @SubscribeToEvents(SONG_ENRICHMENT_QUEUE, [
    EVENT_TYPES.songEnriched,
    EVENT_TYPES.songEnrichmentFailed,
  ])
  async handle(event: SongEnrichmentEvent): Promise<void> {
    if (!isSongEnrichmentEvent(event)) {
      throw new Error(
        `Invalid song enrichment message: ${JSON.stringify(event)?.slice(0, 300)}`,
      );
    }

    await withEventContext(event, async () => {
      const outcome = await this.applySongEnrichmentUseCase.execute(event);
      this.logger.log(
        `${event.type} for song ${event.payload.song_id} (${event.event_id}): ${outcome}`,
      );
    });
  }
}
