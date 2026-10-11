import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from 'sequelize';
import {
  EventEnvelope,
  PlatformEvent,
  PLAYBACK_EVENT_TYPES,
  PlaybackEventType,
} from '@platform/contracts';
import { InboxService } from '@platform/messaging';
import { AnalyticsRepository } from '../common/analytics.repository';
import {
  applyPlaybackEvent,
  PlaybackEvent,
} from '../sessions/session.calculator';

export type IngestionOutcome = 'processed' | 'skipped';

const isPlaybackEvent = (event: EventEnvelope): event is PlaybackEvent =>
  (PLAYBACK_EVENT_TYPES as readonly string[]).includes(event.type);

/**
 * Every consumed event: raw log + projections (catalogue, explicit signals,
 * listening sessions) + "profile changed" marks, in one transaction and once
 * per event_id. Scores and profiles are recomputed later by ProfileJob.
 */
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly repository: AnalyticsRepository,
    private readonly inbox: InboxService,
  ) {}

  async ingest(event: EventEnvelope): Promise<IngestionOutcome> {
    const result = await this.inbox.runOnce(event.event_id, async (t) => {
      await this.repository.insertRawEvent(event, t);
      await this.project(event, t);
    });
    return result.processed ? 'processed' : 'skipped';
  }

  private async project(event: EventEnvelope, t: Transaction): Promise<void> {
    if (isPlaybackEvent(event)) {
      return this.projectPlayback(event, t);
    }

    switch (event.type) {
      case 'song.uploaded': {
        const { payload } = event as PlatformEvent<'song.uploaded'>;
        return this.repository.upsertSong(
          payload.song_id,
          payload.author_id,
          event.occurred_at,
          t,
        );
      }
      case 'song.enriched': {
        const { payload } = event as PlatformEvent<'song.enriched'>;
        await this.repository.setSongTags(
          payload.song_id,
          payload.tags,
          payload.vocabulary_version,
          t,
        );
        // tags arrived after people already listened: their profiles change
        return this.repository.markSongAudienceChanged(payload.song_id, t);
      }
      case 'song.deleted': {
        const { payload } = event as PlatformEvent<'song.deleted'>;
        await this.repository.markSongDeleted(
          payload.song_id,
          event.occurred_at,
          t,
        );
        return this.repository.markSongAudienceChanged(payload.song_id, t);
      }
      case 'song.liked':
      case 'song.unliked': {
        const { payload } = event as PlatformEvent<'song.liked'>;
        await this.repository.setLiked(
          payload.user_id,
          payload.song_id,
          event.type === 'song.liked',
          event.occurred_at,
          t,
        );
        return this.repository.markUserChanged(payload.user_id, t);
      }
      case 'playlist.song_added':
      case 'playlist.song_removed': {
        const { payload } = event as PlatformEvent<'playlist.song_added'>;
        await this.repository.setInPlaylist(
          payload.user_id,
          payload.song_id,
          payload.playlist_id,
          event.type === 'playlist.song_added',
          t,
        );
        return this.repository.markUserChanged(payload.user_id, t);
      }
      default:
        // only stored in the raw log
        return;
    }
  }

  private async projectPlayback(
    event: PlatformEvent<PlaybackEventType>,
    t: Transaction,
  ): Promise<void> {
    // user_id is set by Core from the auth token
    if (!event.user_id) {
      this.logger.warn(`${event.type} ${event.event_id} without user_id`);
      return;
    }

    const session = await this.repository.getSessionForUpdate(
      event.payload.play_id,
      t,
    );
    await this.repository.saveSession(applyPlaybackEvent(session, event), t);
    await this.repository.markUserChanged(event.user_id, t);
  }
}
