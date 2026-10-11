import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes, Transaction } from 'sequelize';
import { SongScore, SongTags, tagVector } from '@platform/contracts';
import { Candidate } from '../ranking/ranking';

/** pgvector text format: [0.1,0,-0.5] */
const toVector = (values: number[]) => `[${values.join(',')}]`;
const fromVector = (text: string | null): number[] | null =>
  text ? JSON.parse(text) : null;

type CandidateRow = Omit<Candidate, 'uploaded_at'> & {
  uploaded_at: string | null;
};

const toCandidate = (row: CandidateRow): Candidate => ({
  ...row,
  content: Number(row.content),
  collaborative: Number(row.collaborative),
  popularity: Number(row.popularity),
  uploaded_at: row.uploaded_at ? new Date(row.uploaded_at) : null,
});

/** Relative popularity: log of the summed positive scores, 0…1. */
const POPULARITY_CTE = `
  popularity AS (
    SELECT song_id, ln(1 + sum(score)) AS raw
    FROM user_scores WHERE score > 0
    GROUP BY song_id
  )`;
const POPULARITY_VALUE = `
  coalesce(pop.raw / nullif((SELECT max(raw) FROM popularity), 0), 0)`;

@Injectable()
export class RecommendationsRepository {
  constructor(private readonly sequelize: Sequelize) {}

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

  // ─── catalogue ──────────────────────────────────────────────

  upsertTrack(
    songId: number,
    authorId: number,
    uploadedAt: string,
    t: Transaction,
  ) {
    return this.run(
      `INSERT INTO tracks (song_id, author_id, uploaded_at)
       VALUES (:songId, :authorId, :uploadedAt)
       ON CONFLICT (song_id) DO UPDATE
         SET author_id = EXCLUDED.author_id, uploaded_at = EXCLUDED.uploaded_at`,
      { songId, authorId, uploadedAt },
      t,
    );
  }

  setTrackTags(
    songId: number,
    tags: SongTags | null,
    vocabularyVersion: number,
    t: Transaction,
  ) {
    return this.run(
      `INSERT INTO tracks (song_id, tags, tag_vector, vocabulary_version)
       VALUES (:songId, CAST(:tags AS jsonb), CAST(:vector AS vector), :vocabularyVersion)
       ON CONFLICT (song_id) DO UPDATE SET
         tags = EXCLUDED.tags,
         tag_vector = EXCLUDED.tag_vector,
         vocabulary_version = EXCLUDED.vocabulary_version`,
      {
        songId,
        tags: tags ? JSON.stringify(tags) : null,
        vector: tags ? toVector(tagVector(tags)) : null,
        vocabularyVersion,
      },
      t,
    );
  }

  markTrackDeleted(songId: number, at: string, t: Transaction) {
    return this.run(
      `INSERT INTO tracks (song_id, deleted_at) VALUES (:songId, :at)
       ON CONFLICT (song_id) DO UPDATE SET deleted_at = EXCLUDED.deleted_at`,
      { songId, at },
      t,
    );
  }

  // ─── users ──────────────────────────────────────────────────

  /** Out-of-order safe: an older profile does not replace a newer one. */
  saveProfile(
    userId: number,
    vector: number[],
    topTags: unknown,
    vocabularyVersion: number,
    at: string,
    t: Transaction,
  ) {
    return this.run(
      `INSERT INTO user_profiles (user_id, vector, top_tags, vocabulary_version, updated_at)
       VALUES (:userId, CAST(:vector AS vector), CAST(:topTags AS jsonb), :vocabularyVersion, :at)
       ON CONFLICT (user_id) DO UPDATE SET
         vector = EXCLUDED.vector,
         top_tags = EXCLUDED.top_tags,
         vocabulary_version = EXCLUDED.vocabulary_version,
         updated_at = EXCLUDED.updated_at
       WHERE user_profiles.updated_at <= EXCLUDED.updated_at`,
      {
        userId,
        vector: toVector(vector),
        topTags: JSON.stringify(topTags),
        vocabularyVersion,
        at,
      },
      t,
    );
  }

  /** Replaces the user's scores unless newer ones are already stored. */
  async replaceScores(
    userId: number,
    scores: SongScore[],
    at: string,
    t: Transaction,
  ): Promise<boolean> {
    const [latest] = await this.select<{ updated_at: string | null }>(
      `SELECT max(updated_at) AS updated_at FROM user_scores WHERE user_id = :userId`,
      { userId },
      t,
    );
    if (latest?.updated_at && new Date(latest.updated_at) > new Date(at)) {
      return false;
    }

    await this.run(
      `DELETE FROM user_scores WHERE user_id = :userId`,
      { userId },
      t,
    );
    if (scores.length === 0) return true;

    const replacements: Record<string, unknown> = { userId, at };
    const values = scores.map((score, i) => {
      replacements[`song${i}`] = score.song_id;
      replacements[`score${i}`] = score.score;
      return `(:userId, :song${i}, :score${i}, :at)`;
    });
    await this.run(
      `INSERT INTO user_scores (user_id, song_id, score, updated_at)
       VALUES ${values.join(', ')}`,
      replacements,
      t,
    );
    return true;
  }

  async getProfileVector(userId: number): Promise<number[] | null> {
    const [row] = await this.select<{ vector: string }>(
      `SELECT vector::text AS vector FROM user_profiles WHERE user_id = :userId`,
      { userId },
    );
    return fromVector(row?.vector ?? null);
  }

  /** The vector with the tag vocabulary it is aligned with */
  async getProfile(
    userId: number,
  ): Promise<{ vector: number[]; vocabulary_version: number } | null> {
    const [row] = await this.select<{
      vector: string;
      vocabulary_version: number;
    }>(
      `SELECT vector::text AS vector, vocabulary_version
       FROM user_profiles WHERE user_id = :userId`,
      { userId },
    );
    if (!row) return null;
    return {
      vector: fromVector(row.vector),
      vocabulary_version: row.vocabulary_version,
    };
  }

  async hasPositiveScores(userId: number): Promise<boolean> {
    const [row] = await this.select<{ exists: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM user_scores WHERE user_id = :userId AND score > 0) AS exists`,
      { userId },
    );
    return row.exists;
  }

  // ─── candidates ─────────────────────────────────────────────

  /**
   * Tracks the user has not interacted with (own and deleted excluded), each
   * with its three signals:
   * - content: cosine similarity of the track's tags to the profile (pgvector);
   * - collaborative: user-based — listeners weighted by the cosine similarity
   *   of their liked-track sets to the user's, share of that weight liking it;
   * - popularity: relative summed positive score.
   */
  async candidatesForUser(userId: number): Promise<Candidate[]> {
    const rows = await this.select<CandidateRow>(
      `WITH profile AS (
         SELECT vector FROM user_profiles WHERE user_id = :userId
       ),
       liked AS (
         SELECT song_id FROM user_scores WHERE user_id = :userId AND score > 0
       ),
       liked_counts AS (
         SELECT user_id, count(*) AS liked FROM user_scores WHERE score > 0 GROUP BY user_id
       ),
       neighbors AS (
         SELECT o.user_id,
                count(*) / sqrt((SELECT count(*) FROM liked) * max(lc.liked)) AS weight
         FROM user_scores o
         JOIN liked l ON l.song_id = o.song_id
         JOIN liked_counts lc ON lc.user_id = o.user_id
         WHERE o.user_id <> :userId AND o.score > 0
         GROUP BY o.user_id
       ),
       collaborative AS (
         SELECT s.song_id, sum(n.weight) / (SELECT sum(weight) FROM neighbors) AS value
         FROM user_scores s JOIN neighbors n ON n.user_id = s.user_id
         WHERE s.score > 0
         GROUP BY s.song_id
       ),
       ${POPULARITY_CTE}
       SELECT t.song_id, t.tags, t.uploaded_at,
              CASE WHEN p.vector IS NOT NULL AND t.tag_vector IS NOT NULL
                        AND vector_norm(p.vector) > 0
                   THEN 1 - (t.tag_vector <=> p.vector) ELSE 0 END AS content,
              coalesce(c.value, 0) AS collaborative,
              ${POPULARITY_VALUE} AS popularity
       FROM tracks t
       LEFT JOIN profile p ON true
       LEFT JOIN collaborative c ON c.song_id = t.song_id
       LEFT JOIN popularity pop ON pop.song_id = t.song_id
       WHERE t.deleted_at IS NULL
         AND t.uploaded_at IS NOT NULL
         AND (t.author_id IS NULL OR t.author_id <> :userId)
         AND t.song_id NOT IN (SELECT song_id FROM user_scores WHERE user_id = :userId)`,
      { userId },
    );
    return rows.map(toCandidate);
  }

  async getTrackVector(songId: number): Promise<number[] | null> {
    const [row] = await this.select<{ vector: string | null }>(
      `SELECT tag_vector::text AS vector FROM tracks WHERE song_id = :songId`,
      { songId },
    );
    return fromVector(row?.vector ?? null);
  }

  /**
   * Other tracks with their signals relative to one track:
   * - content: cosine similarity of the tag vectors;
   * - collaborative: share of the track's fans who also like the candidate;
   * - popularity: as for users.
   */
  async candidatesSimilarTo(songId: number): Promise<Candidate[]> {
    const rows = await this.select<CandidateRow>(
      `WITH target AS (
         SELECT tag_vector FROM tracks WHERE song_id = :songId
       ),
       fans AS (
         SELECT user_id FROM user_scores WHERE song_id = :songId AND score > 0
       ),
       co_liked AS (
         SELECT song_id, count(*)::float / nullif((SELECT count(*) FROM fans), 0) AS value
         FROM user_scores
         WHERE score > 0 AND song_id <> :songId AND user_id IN (SELECT user_id FROM fans)
         GROUP BY song_id
       ),
       ${POPULARITY_CTE}
       SELECT t.song_id, t.tags, t.uploaded_at,
              CASE WHEN tg.tag_vector IS NOT NULL AND t.tag_vector IS NOT NULL
                   THEN 1 - (t.tag_vector <=> tg.tag_vector) ELSE 0 END AS content,
              coalesce(co.value, 0) AS collaborative,
              ${POPULARITY_VALUE} AS popularity
       FROM tracks t
       LEFT JOIN target tg ON true
       LEFT JOIN co_liked co ON co.song_id = t.song_id
       LEFT JOIN popularity pop ON pop.song_id = t.song_id
       WHERE t.song_id <> :songId
         AND t.deleted_at IS NULL
         AND t.uploaded_at IS NOT NULL`,
      { songId },
    );
    return rows.map(toCandidate);
  }
}
