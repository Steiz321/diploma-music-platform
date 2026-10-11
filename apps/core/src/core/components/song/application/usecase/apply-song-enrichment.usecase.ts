import { Inject, Injectable } from '@nestjs/common';
import { PlatformEvent } from '@platform/contracts';
import { InboxService } from '@platform/messaging';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import { TranscriptionStatus } from 'src/core/shared-kernel/data/enum/transcription-status.enum';
import {
  SongRepository,
  SongRepositoryType,
} from '../../ports/song.repository';
import { SongUpdateParams } from '../../secondary-adapters/postgres/query-params/song/update-song.params';

export type SongEnrichmentEvent =
  | PlatformEvent<'song.enriched'>
  | PlatformEvent<'song.enrichment_failed'>;

export type ApplyEnrichmentOutcome = 'applied' | 'skipped' | 'song_missing';

/**
 * Stores the result of the AI enrichment service on the song. Runs once per
 * event (inbox); an event for a deleted song is acknowledged and ignored.
 */
@Injectable()
export default class ApplySongEnrichmentUseCase
  implements UseCase<SongEnrichmentEvent, ApplyEnrichmentOutcome>
{
  constructor(
    @Inject(SongRepositoryType)
    private readonly songRepository: SongRepository,
    private readonly inbox: InboxService,
  ) {}

  public async execute(
    event: SongEnrichmentEvent,
  ): Promise<ApplyEnrichmentOutcome> {
    // Looked up before the transaction: a query outside it while it is open
    // needs a second pool connection, and a burst of messages handled in
    // parallel then exhausts the pool (every handler holds one, waits for
    // another).
    const song = await this.songRepository.getOneWhere({
      id: event.payload.song_id,
    });
    if (!song) {
      return 'song_missing';
    }

    const result = await this.inbox.runOnce(event.event_id, (t) =>
      this.songRepository.update(toSongUpdate(event), { id: song.id }, t),
    );

    return result.processed ? 'applied' : 'skipped';
  }
}

const toSongUpdate = (event: SongEnrichmentEvent): SongUpdateParams => {
  if (event.type === 'song.enrichment_failed') {
    return { transcription_status: TranscriptionStatus.failed };
  }

  const { payload } = event as PlatformEvent<'song.enriched'>;
  return {
    transcription: payload.transcription,
    transcription_status:
      payload.status === 'done'
        ? TranscriptionStatus.done
        : TranscriptionStatus.no_lyrics,
    language: payload.transcription.language,
    text: payload.text,
    lyrics: payload.lyrics,
    tags: payload.tags,
    vocabulary_version: payload.vocabulary_version,
  };
};
