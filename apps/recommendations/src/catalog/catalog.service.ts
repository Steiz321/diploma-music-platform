import { Injectable } from '@nestjs/common';
import { EventEnvelope, PlatformEvent } from '@platform/contracts';
import { InboxService } from '@platform/messaging';
import { RecommendationsRepository } from '../common/recommendations.repository';

/**
 * Keeps the service's own copy of what it needs: tracks with tag vectors,
 * user profiles and scores (database per service, filled from events).
 */
@Injectable()
export class CatalogService {
  constructor(
    private readonly repository: RecommendationsRepository,
    private readonly inbox: InboxService,
  ) {}

  async apply(event: EventEnvelope): Promise<'processed' | 'skipped'> {
    const result = await this.inbox.runOnce(event.event_id, async (t) => {
      switch (event.type) {
        case 'song.uploaded': {
          const { payload } = event as PlatformEvent<'song.uploaded'>;
          return this.repository.upsertTrack(
            payload.song_id,
            payload.author_id,
            event.occurred_at,
            t,
          );
        }
        case 'song.enriched': {
          const { payload } = event as PlatformEvent<'song.enriched'>;
          return this.repository.setTrackTags(
            payload.song_id,
            payload.tags,
            payload.vocabulary_version,
            t,
          );
        }
        case 'song.deleted': {
          const { payload } = event as PlatformEvent<'song.deleted'>;
          return this.repository.markTrackDeleted(
            payload.song_id,
            event.occurred_at,
            t,
          );
        }
        case 'profile.updated': {
          const { payload } = event as PlatformEvent<'profile.updated'>;
          return this.repository.saveProfile(
            payload.user_id,
            payload.vector,
            payload.top_tags,
            payload.vocabulary_version,
            event.occurred_at,
            t,
          );
        }
        case 'scores.updated': {
          const { payload } = event as PlatformEvent<'scores.updated'>;
          await this.repository.replaceScores(
            payload.user_id,
            payload.scores,
            event.occurred_at,
            t,
          );
          return;
        }
      }
    });
    return result.processed ? 'processed' : 'skipped';
  }
}
