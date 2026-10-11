import {
  ProfileTopTags,
  SongTags,
  TAG_VECTOR_KEYS,
  tagVector,
} from '@platform/contracts';

export interface ScoredSong {
  score: number;
  tags: SongTags | null;
}

export interface Profile {
  /** aligned with TAG_VECTOR_KEYS, values from -1 to +1 */
  vector: number[];
  top_tags: ProfileTopTags;
  scored_songs: number;
}

const TOP_TAGS = 3;

const topOf = (vector: number[], group: string, count: number): string[] =>
  TAG_VECTOR_KEYS.map((key, i) => ({ key, value: vector[i] }))
    .filter(({ key, value }) => key.startsWith(`${group}:`) && value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, count)
    .map(({ key }) => key.slice(group.length + 1));

/**
 * Preference per tag: the score-weighted share of the user's tracks having
 * the tag, normalised by the total weight, so values stay in -1…+1 and
 * negative scores (skips, unlikes) pull a tag below zero.
 */
export const buildProfile = (songs: ScoredSong[]): Profile => {
  const considered = songs.filter((song) => song.tags && song.score !== 0);
  const totalWeight = considered.reduce(
    (sum, song) => sum + Math.abs(song.score),
    0,
  );
  const vector = TAG_VECTOR_KEYS.map(() => 0);

  for (const song of considered) {
    tagVector(song.tags).forEach((present, i) => {
      vector[i] += present * song.score;
    });
  }

  const normalized = vector.map((value) =>
    totalWeight ? Math.round((value / totalWeight) * 10_000) / 10_000 : 0,
  );

  return {
    vector: normalized,
    top_tags: {
      mood: topOf(normalized, 'mood', TOP_TAGS),
      topics: topOf(normalized, 'topics', TOP_TAGS),
      energy: topOf(normalized, 'energy', 1)[0] ?? null,
    },
    scored_songs: considered.length,
  };
};

/** True when any value moved by more than the threshold (or it is new). */
export const profileChanged = (
  previous: number[] | null,
  next: number[],
  threshold: number,
): boolean =>
  !previous ||
  previous.length !== next.length ||
  next.some((value, i) => Math.abs(value - previous[i]) > threshold);
