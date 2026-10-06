import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes, Transaction } from 'sequelize';
import { EventEnvelope, SongTags } from '@platform/contracts';
import { SessionState } from '../sessions/session.calculator';
import { SongFeatures } from '../scoring/score.calculator';
import { Profile } from '../profiles/profile.calculator';

export interface SongFeaturesRow extends SongFeatures {
  song_id: number;
  tags: SongTags | null;
  vocabulary_version: number | null;
}

export interface PendingProfile {
  user_id: number;
  changed_at: Date;
}

/**
 * changed_at is compared with computed_at, which comes back from JavaScript
 * with millisecond precision: store it with the same precision, otherwise a
 * profile would look changed forever.
 */
const CHANGED_NOW = `date_trunc('milliseconds', now())`;

/**
 * All SQL of the service. Aggregations run in Postgres; the score and the
 * profile formulas are plain functions (scoring/, profiles/).
 */
@Injectable()
export class AnalyticsRepository {
  constructor(private readonly sequelize: Sequelize) {}

  transaction<T>(work: (transaction: Transaction) => Promise<T>): Promise<T> {
    return this.sequelize.transaction(work);
  }

  private async run(
    sql: string,
    replacements: Record<string, unknown>,
    transaction?: Transaction,
  ): Promise<void> {
    await this.sequelize.query(sql, { replacements, transaction });
  }

  private select<T extends object>(
    sql: string,
    replacements: Record<string, unknown>,
    transaction?: Transaction,
  ): Promise<T[]> {
    return this.sequelize.query<T>(sql, {
      replacements,
      transaction,
      type: QueryTypes.SELECT,
    });
  }

  // ─── raw log and catalogue ──────────────────────────────────

  insertRawEvent(event: EventEnvelope, t: Transaction): Promise<void> {
    const payload = event.payload as { song_id?: number };
    return this.run(
      `INSERT INTO raw_events
         (event_id, type, producer, user_id, song_id, occurred_at, correlation_id, payload)
       VALUES (:eventId, :type, :producer, :userId, :songId, :occurredAt, :correlationId,
               CAST(:payload AS jsonb))`,
      {
        eventId: event.event_id,
        type: event.type,
        producer: event.producer,
        userId: event.user_id ?? null,
        songId: payload?.song_id ?? null,
        occurredAt: event.occurred_at,
        correlationId: event.correlation_id ?? null,
        payload: JSON.stringify(event),
      },
      t,
    );
  }

  upsertSong(
    songId: number,
    authorId: number,
    uploadedAt: string,
    t: Transaction,
  ): Promise<void> {
    return this.run(
      `INSERT INTO songs (song_id, author_id, uploaded_at)
       VALUES (:songId, :authorId, :uploadedAt)
       ON CONFLICT (song_id) DO UPDATE
         SET author_id = EXCLUDED.author_id, uploaded_at = EXCLUDED.uploaded_at`,
      { songId, authorId, uploadedAt },
      t,
    );
  }

  setSongTags(
    songId: number,
    tags: SongTags | null,
    vocabularyVersion: number,
    t: Transaction,
  ): Promise<void> {
    return this.run(
      `INSERT INTO songs (song_id, tags, vocabulary_version)
       VALUES (:songId, CAST(:tags AS jsonb), :vocabularyVersion)
       ON CONFLICT (song_id) DO UPDATE
         SET tags = EXCLUDED.tags, vocabulary_version = EXCLUDED.vocabulary_version`,
      { songId, tags: tags ? JSON.stringify(tags) : null, vocabularyVersion },
      t,
    );
  }

  markSongDeleted(songId: number, at: string, t: Transaction): Promise<void> {
    return this.run(
      `INSERT INTO songs (song_id, deleted_at) VALUES (:songId, :at)
       ON CONFLICT (song_id) DO UPDATE SET deleted_at = EXCLUDED.deleted_at`,
      { songId, at },
      t,
    );
  }

  // ─── explicit signals ───────────────────────────────────────

  /** Out-of-order safe: an older like/unlike does not override a newer one. */
  setLiked(
    userId: number,
    songId: number,
    liked: boolean,
    at: string,
    t: Transaction,
  ): Promise<void> {
    return this.run(
      `INSERT INTO user_song_state (user_id, song_id, liked, liked_changed_at)
       VALUES (:userId, :songId, :liked, :at)
       ON CONFLICT (user_id, song_id) DO UPDATE
         SET liked = EXCLUDED.liked, liked_changed_at = EXCLUDED.liked_changed_at
         WHERE user_song_state.liked_changed_at IS NULL
            OR user_song_state.liked_changed_at <= EXCLUDED.liked_changed_at`,
      { userId, songId, liked, at },
      t,
    );
  }

  setInPlaylist(
    userId: number,
    songId: number,
    playlistId: number,
    inPlaylist: boolean,
    t: Transaction,
  ): Promise<void> {
    return this.run(
      inPlaylist
        ? `INSERT INTO user_song_state (user_id, song_id, playlist_ids)
           VALUES (:userId, :songId, ARRAY[:playlistId]::integer[])
           ON CONFLICT (user_id, song_id) DO UPDATE
             SET playlist_ids = array_append(
               array_remove(user_song_state.playlist_ids, :playlistId), :playlistId)`
        : `UPDATE user_song_state
             SET playlist_ids = array_remove(playlist_ids, :playlistId)
           WHERE user_id = :userId AND song_id = :songId`,
      { userId, songId, playlistId },
      t,
    );
  }

  // ─── listening sessions ─────────────────────────────────────

  /**
   * The session row is created by the first event of a play_id, so FOR UPDATE
   * alone cannot serialise two events of a new session: a transaction-scoped
   * advisory lock on the play_id does.
   */
  async getSessionForUpdate(
    playId: string,
    t: Transaction,
  ): Promise<SessionState | null> {
    await this.run(
      `SELECT pg_advisory_xact_lock(hashtextextended(:playId, 0))`,
      { playId },
      t,
    );
    const [row] = await this.select<SessionState>(
      `SELECT * FROM listening_sessions WHERE play_id = :playId FOR UPDATE`,
      { playId },
      t,
    );
    return row
      ? {
          ...row,
          started_at: new Date(row.started_at),
          last_event_at: new Date(row.last_event_at),
        }
      : null;
  }

  saveSession(session: SessionState, t: Transaction): Promise<void> {
    return this.run(
      `INSERT INTO listening_sessions
         (play_id, user_id, song_id, source, started_at, last_event_at, last_position,
          playing, listened_sec, max_position, duration_sec, completed, skipped,
          skipped_early, events_count)
       VALUES (:play_id, :user_id, :song_id, CAST(:source AS jsonb), :started_at,
          :last_event_at, :last_position, :playing, :listened_sec, :max_position,
          :duration_sec, :completed, :skipped, :skipped_early, :events_count)
       ON CONFLICT (play_id) DO UPDATE SET
         last_event_at = EXCLUDED.last_event_at,
         last_position = EXCLUDED.last_position,
         playing = EXCLUDED.playing,
         listened_sec = EXCLUDED.listened_sec,
         max_position = EXCLUDED.max_position,
         duration_sec = EXCLUDED.duration_sec,
         completed = EXCLUDED.completed,
         skipped = EXCLUDED.skipped,
         skipped_early = EXCLUDED.skipped_early,
         events_count = EXCLUDED.events_count`,
      { ...session, source: JSON.stringify(session.source) },
      t,
    );
  }

  // ─── profiles to recompute ──────────────────────────────────

  markUserChanged(userId: number, t: Transaction): Promise<void> {
    return this.run(
      `INSERT INTO user_profiles (user_id, changed_at) VALUES (:userId, ${CHANGED_NOW})
       ON CONFLICT (user_id) DO UPDATE SET changed_at = ${CHANGED_NOW}`,
      { userId },
      t,
    );
  }

  /** Everyone who listened to, liked or saved the song (its tags changed). */
  markSongAudienceChanged(songId: number, t: Transaction): Promise<void> {
    return this.run(
      `INSERT INTO user_profiles (user_id, changed_at)
       SELECT user_id, ${CHANGED_NOW} FROM (
         SELECT user_id FROM listening_sessions WHERE song_id = :songId
         UNION
         SELECT user_id FROM user_song_state WHERE song_id = :songId
       ) audience
       ON CONFLICT (user_id) DO UPDATE SET changed_at = ${CHANGED_NOW}`,
      { songId },
      t,
    );
  }

  pendingProfiles(limit: number): Promise<PendingProfile[]> {
    return this.select<PendingProfile>(
      `SELECT user_id, changed_at FROM user_profiles
       WHERE computed_at IS NULL OR changed_at > computed_at
       ORDER BY changed_at
       LIMIT :limit`,
      { limit },
    );
  }

  // ─── scores and profiles ────────────────────────────────────

  /** One row per song the user interacted with (own and deleted songs excluded). */
  songFeatures(userId: number, t: Transaction): Promise<SongFeaturesRow[]> {
    return this.select<SongFeaturesRow>(
      `WITH sessions AS (
         SELECT song_id,
           count(*) FILTER (WHERE completed)::int AS completions,
           count(*) FILTER (WHERE skipped_early)::int AS early_skips,
           coalesce(max(CASE WHEN NOT completed AND NOT skipped_early AND duration_sec > 0
                             THEN least(listened_sec / duration_sec, 1) END), 0) AS partial_ratio
         FROM listening_sessions
         WHERE user_id = :userId
         GROUP BY song_id
       ),
       pairs AS (
         SELECT song_id FROM sessions
         UNION
         SELECT song_id FROM user_song_state WHERE user_id = :userId
       )
       SELECT p.song_id,
              st.liked,
              coalesce(cardinality(st.playlist_ids), 0)::int AS playlists,
              coalesce(se.completions, 0)::int AS completions,
              coalesce(se.early_skips, 0)::int AS early_skips,
              coalesce(se.partial_ratio, 0)::float AS partial_ratio,
              so.tags,
              so.vocabulary_version
       FROM pairs p
       LEFT JOIN sessions se ON se.song_id = p.song_id
       LEFT JOIN user_song_state st ON st.user_id = :userId AND st.song_id = p.song_id
       LEFT JOIN songs so ON so.song_id = p.song_id
       WHERE so.deleted_at IS NULL
         AND (so.author_id IS NULL OR so.author_id <> :userId)`,
      { userId },
      t,
    );
  }

  async replaceScores(
    userId: number,
    rows: (SongFeaturesRow & { score: number })[],
    t: Transaction,
  ): Promise<void> {
    await this.run(
      `DELETE FROM user_song_scores WHERE user_id = :userId`,
      { userId },
      t,
    );
    if (rows.length === 0) return;

    const replacements: Record<string, unknown> = { userId };
    const values = rows.map((row, i) => {
      Object.assign(replacements, {
        [`song${i}`]: row.song_id,
        [`score${i}`]: row.score,
        [`liked${i}`]: row.liked,
        [`playlists${i}`]: row.playlists,
        [`completions${i}`]: row.completions,
        [`earlySkips${i}`]: row.early_skips,
        [`partial${i}`]: row.partial_ratio,
      });
      return `(:userId, :song${i}, :score${i}, :liked${i}, :playlists${i}, :completions${i},
               :earlySkips${i}, :partial${i}, now())`;
    });
    await this.run(
      `INSERT INTO user_song_scores
         (user_id, song_id, score, liked, playlists, completions, early_skips,
          partial_ratio, computed_at)
       VALUES ${values.join(', ')}`,
      replacements,
      t,
    );
  }

  async getProfileVector(
    userId: number,
    t: Transaction,
  ): Promise<number[] | null> {
    const [row] = await this.select<{ vector: number[] | null }>(
      `SELECT vector FROM user_profiles WHERE user_id = :userId FOR UPDATE`,
      { userId },
      t,
    );
    return row?.vector ?? null;
  }

  /**
   * computed_at = the changed_at the computation started from: a change that
   * arrives meanwhile keeps the profile pending for the next run.
   */
  saveProfile(
    userId: number,
    profile: Profile,
    vocabularyVersion: number,
    computedFrom: Date,
    published: boolean,
    t: Transaction,
  ): Promise<void> {
    return this.run(
      `UPDATE user_profiles SET
         vector = CAST(:vector AS double precision[]),
         vocabulary_version = :vocabularyVersion,
         top_tags = CAST(:topTags AS jsonb),
         scored_songs = :scoredSongs,
         computed_at = :computedFrom,
         published_at = CASE WHEN :published THEN now() ELSE published_at END
       WHERE user_id = :userId`,
      {
        userId,
        vector: `{${profile.vector.join(',')}}`,
        vocabularyVersion,
        topTags: JSON.stringify(profile.top_tags),
        scoredSongs: profile.scored_songs,
        computedFrom,
        published,
      },
      t,
    );
  }

  // ─── debug view ─────────────────────────────────────────────

  async profileView(userId: number) {
    const [profile] = await this.select<Record<string, unknown>>(
      `SELECT user_id, vector, vocabulary_version, top_tags, scored_songs, changed_at,
              computed_at, published_at,
              (computed_at IS NULL OR changed_at > computed_at) AS pending
       FROM user_profiles WHERE user_id = :userId`,
      { userId },
    );
    const scores = await this.select<Record<string, unknown>>(
      `SELECT sc.song_id, sc.score, sc.liked, sc.playlists, sc.completions,
              sc.early_skips, sc.partial_ratio, so.tags
       FROM user_song_scores sc LEFT JOIN songs so USING (song_id)
       WHERE sc.user_id = :userId
       ORDER BY sc.score DESC`,
      { userId },
    );
    const [sessions] = await this.select<Record<string, unknown>>(
      `SELECT count(*)::int AS sessions,
              count(*) FILTER (WHERE completed)::int AS completed,
              count(*) FILTER (WHERE skipped_early)::int AS skipped_early,
              coalesce(round(sum(listened_sec)::numeric, 1), 0)::float AS listened_sec
       FROM listening_sessions WHERE user_id = :userId`,
      { userId },
    );
    return { profile: profile ?? null, scores, sessions };
  }
}
