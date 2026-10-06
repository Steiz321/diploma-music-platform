import {
  Recommendation,
  SongTags,
  TAG_VECTOR_KEYS,
  tagVector,
} from '@platform/contracts';

export interface RankingWeights {
  content: number;
  collaborative: number;
  popularity: number;
}

/** A track that may be recommended, with its three signals (from SQL). */
export interface Candidate {
  song_id: number;
  tags: SongTags | null;
  /** cosine similarity of tags to the profile / the track (-1…1) */
  content: number;
  /** share of similar listeners who like it (0…1) */
  collaborative: number;
  /** relative popularity (0…1) */
  popularity: number;
  uploaded_at: Date | null;
}

/** a profile value above this is a liked tag worth naming as a reason */
const REASON_MIN_PREFERENCE = 0.1;
const MAX_REASON_TAGS = 3;

const round = (value: number) => Math.round(value * 10_000) / 10_000;

// language rarely explains a choice (most tracks share it); it still counts
// in the similarity itself
const UNEXPLAINING_GROUPS = ['language:'];
// energy is a weak reason: named only when no mood or topic matches
const WEAK_GROUPS = ['energy:'];

/**
 * Tags of the track that the reference (a profile vector, or the tag vector
 * of the track the user is looking at) values most: moods and topics first.
 */
export const reasonTags = (
  tags: SongTags | null,
  reference: number[] | null,
): string[] => {
  if (!tags || !reference) return [];
  const matching = tagVector(tags)
    .map((present, i) => ({
      key: TAG_VECTOR_KEYS[i],
      weight: present * reference[i],
    }))
    .filter(
      ({ key, weight }) =>
        weight > REASON_MIN_PREFERENCE &&
        !UNEXPLAINING_GROUPS.some((group) => key.startsWith(group)),
    )
    .sort((a, b) => b.weight - a.weight);

  const strong = matching.filter(
    ({ key }) => !WEAK_GROUPS.some((group) => key.startsWith(group)),
  );
  return (strong.length ? strong : matching)
    .slice(0, MAX_REASON_TAGS)
    .map(({ key }) => key);
};

/**
 * Hybrid ranking: a weighted sum of the content, collaborative and popularity
 * signals; newer tracks first on equal scores. Every item explains itself.
 */
export const rank = (
  candidates: Candidate[],
  weights: RankingWeights,
  reference: number[] | null,
  limit: number,
): Recommendation[] =>
  candidates
    .map((candidate) => {
      const parts = {
        content: weights.content * candidate.content,
        collaborative: weights.collaborative * candidate.collaborative,
        popularity: weights.popularity * candidate.popularity,
      };
      const score = parts.content + parts.collaborative + parts.popularity;
      return { candidate, parts, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.candidate.uploaded_at?.getTime() ?? 0) -
          (a.candidate.uploaded_at?.getTime() ?? 0),
    )
    .slice(0, limit)
    .map(({ candidate, parts, score }) => ({
      song_id: candidate.song_id,
      score: round(score),
      components: {
        content: round(candidate.content),
        collaborative: round(candidate.collaborative),
        popularity: round(candidate.popularity),
      },
      reasons: {
        tags: parts.content > 0 ? reasonTags(candidate.tags, reference) : [],
        similar_listeners: parts.collaborative > 0,
        // popularity is the strongest of the three contributions
        popular:
          parts.popularity > 0 &&
          parts.popularity >= Math.max(parts.content, parts.collaborative),
      },
    }));
