import type { UserTaste } from "../api/user";
import { tagLabel } from "./reasons";

export interface TasteShare {
  /** "group:value" tag key */
  key: string;
  label: string;
  /** whole percent; the shares of a taste add up to 100 */
  percent: number;
}

export interface TasteSummary {
  moods: TasteShare[];
  /** labels of the top topics, strongest first */
  topics: string[];
}

const MAX_MOODS = 5;
const MAX_TOPICS = 3;
/** fewer moods than this say too little to show a breakdown */
const MIN_MOODS = 2;

/**
 * Whole percents of the counts that add up to exactly 100: every value is
 * rounded down, then the largest remainders get the missing points.
 */
export const toPercents = (counts: number[]): number[] => {
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total === 0) return counts.map(() => 0);
  const exact = counts.map((count) => (count / total) * 100);
  const percents = exact.map(Math.floor);
  let missing = 100 - percents.reduce((sum, p) => sum + p, 0);
  const byRemainder = exact
    .map((value, i) => ({ i, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest);
  for (const { i } of byRemainder) {
    if (missing-- <= 0) break;
    percents[i] += 1;
  }
  return percents;
};

/**
 * The user's taste: the moods and topics the profile from the analytics
 * service prefers most. Mood shares are relative to the shown moods.
 * Null without a profile or with too few moods to compare.
 */
export const describeTaste = (taste: UserTaste | null): TasteSummary | null => {
  if (!taste || taste.moods.length < MIN_MOODS) return null;

  const moods = taste.moods.slice(0, MAX_MOODS);
  const percents = toPercents(moods.map((mood) => mood.value));

  return {
    moods: moods.map(({ key }, i) => ({
      key,
      label: tagLabel(key),
      percent: percents[i],
    })),
    topics: taste.topics.slice(0, MAX_TOPICS).map(({ key }) => tagLabel(key)),
  };
};
