/**
 * Fixed tag vocabulary. Tags are the source data for track vectors: every
 * value is one position of the multi-hot vector, so changing the lists means
 * a new TAG_VOCABULARY_VERSION.
 */
export const TAG_VOCABULARY_VERSION = 1;

export const TAG_VOCABULARY = {
  mood: [
    'happy',
    'sad',
    'melancholic',
    'romantic',
    'angry',
    'calm',
    'energetic',
    'nostalgic',
    'hopeful',
    'dark',
    'playful',
    'dreamy',
  ],
  topics: [
    'love',
    'heartbreak',
    'friendship',
    'family',
    'party',
    'freedom',
    'self_discovery',
    'loneliness',
    'memories',
    'social_issues',
    'war',
    'homeland',
    'nature',
    'travel',
    'success',
    'faith',
    'death',
    'city_life',
  ],
  energy: ['low', 'medium', 'high'],
  language: ['uk', 'en', 'other'],
} as const;

export type MoodTag = (typeof TAG_VOCABULARY.mood)[number];
export type TopicTag = (typeof TAG_VOCABULARY.topics)[number];
export type EnergyTag = (typeof TAG_VOCABULARY.energy)[number];
export type LanguageTag = (typeof TAG_VOCABULARY.language)[number];

/** how many values a multi-value group must have */
export const TAG_LIMITS = {
  mood: { min: 1, max: 3 },
  topics: { min: 1, max: 3 },
} as const;

export interface SongTags {
  mood: MoodTag[];
  topics: TopicTag[];
  energy: EnergyTag;
  language: LanguageTag;
}

/** Maps a detected language code (ISO-639-1) to the language tag. */
export const toLanguageTag = (code: string | null | undefined): LanguageTag => {
  const normalized = (code ?? '').toLowerCase();
  if (normalized === 'uk' || normalized === 'ukrainian') return 'uk';
  if (normalized === 'en' || normalized === 'english') return 'en';
  return 'other';
};

const pick = <T extends string>(
  values: unknown,
  allowed: readonly T[],
  max: number,
): T[] => {
  const list = Array.isArray(values) ? values : [];
  const known = list.filter((value): value is T =>
    allowed.includes(value as T),
  );
  return [...new Set(known)].slice(0, max);
};

/**
 * Keeps only values from the vocabulary, removes duplicates and extra values.
 * Returns null when a group ends up below its minimum or energy is unknown.
 */
export const normalizeTags = (
  raw: { mood?: unknown; topics?: unknown; energy?: unknown },
  language: LanguageTag,
): SongTags | null => {
  const mood = pick(raw.mood, TAG_VOCABULARY.mood, TAG_LIMITS.mood.max);
  const topics = pick(raw.topics, TAG_VOCABULARY.topics, TAG_LIMITS.topics.max);
  const energy = TAG_VOCABULARY.energy.find((value) => value === raw.energy);

  if (
    mood.length < TAG_LIMITS.mood.min ||
    topics.length < TAG_LIMITS.topics.min ||
    !energy
  ) {
    return null;
  }

  return { mood, topics, energy, language };
};
