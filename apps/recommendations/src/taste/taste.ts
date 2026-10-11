import { TAG_VECTOR_KEYS, TastePreference } from '@platform/contracts';

const MAX_MOODS = 5;
const MAX_TOPICS = 3;

/** The tags of one group the profile likes (value above 0), strongest first. */
export const likedTags = (
  vector: number[],
  group: string,
  count: number,
): TastePreference[] =>
  TAG_VECTOR_KEYS.map((key, i) => ({ key, value: vector[i] ?? 0 }))
    .filter(({ key, value }) => key.startsWith(`${group}:`) && value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, count);

/** What the "Your taste" card of the feed shows. */
export const describeTaste = (vector: number[]) => ({
  moods: likedTags(vector, 'mood', MAX_MOODS),
  topics: likedTags(vector, 'topics', MAX_TOPICS),
});
