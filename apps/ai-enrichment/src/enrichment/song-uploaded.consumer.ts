import { Injectable, Logger } from '@nestjs/common';
import {
  EVENT_TYPES,
  isFromExpectedProducer,
  PlatformEvent,
} from '@platform/contracts';
import { SubscribeToEvents, withEventContext } from '@platform/messaging';
import { EnrichmentService } from './enrichment.service';

export const SONG_UPLOADED_QUEUE = 'ai-enrichment.song-uploaded';

// only Core announces uploads
export const isSongUploaded = (
  event: any,
): event is PlatformEvent<'song.uploaded'> =>
  event?.type === EVENT_TYPES.songUploaded &&
  isFromExpectedProducer(event) &&
  typeof event.event_id === 'string' &&
  Number.isInteger(event.payload?.song_id) &&
  typeof event.payload?.audio_key === 'string';

@Injectable()
export class SongUploadedConsumer {
  private readonly logger = new Logger(SongUploadedConsumer.name);

  constructor(private readonly enrichment: EnrichmentService) {}

  // a malformed message, a wrong producer or an unexpected error rejects it
  // to the DLQ
  @SubscribeToEvents(SONG_UPLOADED_QUEUE, [EVENT_TYPES.songUploaded])
  async handle(event: PlatformEvent<'song.uploaded'>): Promise<void> {
    if (!isSongUploaded(event)) {
      throw new Error(
        `Invalid song.uploaded message: ${JSON.stringify(event)?.slice(0, 300)}`,
      );
    }

    await withEventContext(event, async () => {
      const outcome = await this.enrichment.enrich(event);
      this.logger.log(
        `Song ${event.payload.song_id} (${event.event_id}): ${outcome}`,
      );
    });
  }
}
