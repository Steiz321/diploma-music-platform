import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  EVENT_TYPES,
  SongTags,
  TAG_VOCABULARY_VERSION,
} from '@platform/contracts';
import { createEvent, OutboxPort, OutboxPortType } from '@platform/messaging';
import { ProfilesConfig } from '../config/config.type';
import {
  AnalyticsRepository,
  PendingProfile,
} from '../common/analytics.repository';
import { scoreSong } from '../scoring/score.calculator';
import { buildProfile, profileChanged } from './profile.calculator';
import { PRODUCER } from '../common/producer.constant';

const INTERVAL_NAME = 'profile-recompute';

export interface RecomputeResult {
  recomputed: number;
  published: number;
}

/**
 * Batch recomputation instead of work on every event: events only mark a
 * user as changed; once per interval the changed users get their scores
 * (SQL aggregation + score formula) and profile rebuilt; the scores are
 * published as scores.updated, and a noticeable profile change as
 * profile.updated, both through the outbox.
 */
@Injectable()
export class ProfileJob
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(ProfileJob.name);
  private readonly config: ProfilesConfig;
  private running = false;

  constructor(
    private readonly repository: AnalyticsRepository,
    @Inject(OutboxPortType)
    private readonly outbox: OutboxPort,
    private readonly schedulerRegistry: SchedulerRegistry,
    configService: ConfigService,
  ) {
    this.config = configService.get<ProfilesConfig>('profiles');
  }

  onApplicationBootstrap(): void {
    const interval = setInterval(
      () => void this.run(),
      this.config.recomputeIntervalMs,
    );
    this.schedulerRegistry.addInterval(INTERVAL_NAME, interval);
  }

  onApplicationShutdown(): void {
    if (this.schedulerRegistry.doesExist('interval', INTERVAL_NAME)) {
      this.schedulerRegistry.deleteInterval(INTERVAL_NAME);
    }
  }

  /** One run; null when the previous run is still going. */
  async run(): Promise<RecomputeResult | null> {
    if (this.running) return null;
    this.running = true;
    const result: RecomputeResult = { recomputed: 0, published: 0 };

    try {
      const pending = await this.repository.pendingProfiles(
        this.config.batchSize,
      );
      for (const profile of pending) {
        try {
          const published = await this.recompute(profile);
          result.recomputed += 1;
          if (published) result.published += 1;
        } catch (err) {
          // stays pending and is retried on the next run
          this.logger.error(
            `Profile of user ${profile.user_id} failed: ${err.message}`,
            err.stack,
          );
        }
      }
      if (result.recomputed > 0) {
        this.logger.log(
          `Recomputed ${result.recomputed} profile(s), published ${result.published}`,
        );
      }
      return result;
    } catch (err) {
      this.logger.error(`Profile run failed: ${err.message}`, err.stack);
      return result;
    } finally {
      this.running = false;
    }
  }

  private recompute({ user_id: userId, changed_at }: PendingProfile) {
    return this.repository.transaction(async (t) => {
      const features = await this.repository.songFeatures(userId, t);
      const scored = features.map((row) => ({ ...row, score: scoreSong(row) }));
      await this.repository.replaceScores(userId, scored, t);

      const profile = buildProfile(
        scored.map((row) => ({
          score: row.score,
          // tags of another vocabulary version are not comparable
          tags:
            row.vocabulary_version === TAG_VOCABULARY_VERSION
              ? (row.tags as SongTags)
              : null,
        })),
      );

      const previous = await this.repository.getProfileVector(userId, t);
      const publish = profileChanged(
        previous,
        profile.vector,
        this.config.publishThreshold,
      );

      await this.repository.saveProfile(
        userId,
        profile,
        TAG_VOCABULARY_VERSION,
        changed_at,
        publish,
        t,
      );

      if (publish) {
        await this.outbox.add(
          createEvent(
            PRODUCER,
            EVENT_TYPES.profileUpdated,
            {
              user_id: userId,
              vector: profile.vector,
              vocabulary_version: TAG_VOCABULARY_VERSION,
              top_tags: profile.top_tags,
              scored_songs: profile.scored_songs,
            },
            userId,
          ),
          { transaction: t, aggregateType: 'user', aggregateId: userId },
        );
      }
      // the scores themselves, for collaborative filtering in Recommendations
      // (the score formula stays in one place)
      await this.outbox.add(
        createEvent(
          PRODUCER,
          EVENT_TYPES.scoresUpdated,
          {
            user_id: userId,
            scores: scored
              .filter((row) => row.score !== 0)
              .map((row) => ({ song_id: row.song_id, score: row.score })),
          },
          userId,
        ),
        { transaction: t, aggregateType: 'user', aggregateId: userId },
      );

      return publish;
    });
  }
}
