import type { RecommendedSong, RecommendedSongs } from "../api/song";
import { tagLabel } from "./reasons";

export interface MixSummary {
  title: string;
  subtitle: string;
  /** tag keys ("group:value") to show as chips, most frequent first */
  tags: string[];
}

export const COLD_START_TITLE = "Popular right now";
export const COLD_START_SUBTITLE =
  "Play a few songs and this mix will start to follow your taste.";

/**
 * Tag keys that explain a song: its reasons, or its own mood tags when the
 * service sent no reasons.
 */
const songTagKeys = (song: RecommendedSong): string[] => {
  if (song.reasons) return song.reasons.tags;
  return (song.tags?.mood ?? []).map((mood) => `mood:${mood}`);
};

/**
 * Keys ordered by how many songs mention them; ties keep the order of
 * first appearance (Array.prototype.sort is stable).
 */
export const rankTags = (
  songs: RecommendedSong[],
  filter: (key: string) => boolean = () => true
): string[] => {
  const counts = new Map<string, number>();
  for (const song of songs) {
    for (const key of new Set(songTagKeys(song))) {
      if (filter(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)!);
};

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

/** "Calm & nostalgic mix", "Calm mix" or "Your mix" */
export const mixTitle = (songs: RecommendedSong[]): string => {
  const moods = rankTags(songs, (key) => key.startsWith("mood:"))
    .slice(0, 2)
    .map(tagLabel);
  if (moods.length === 0) return "Your mix";
  return `${capitalize(moods.join(" & "))} mix`;
};

const listWords = (words: string[]) =>
  words.length <= 1
    ? words.join("")
    : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;

/** Title, subtitle and chips of the "Made for you" hero. */
export const describeMix = (result: RecommendedSongs): MixSummary => {
  if (result.source === "popular" || result.cold_start) {
    return { title: COLD_START_TITLE, subtitle: COLD_START_SUBTITLE, tags: [] };
  }
  const tags = rankTags(result.songs).slice(0, 3);
  const count = result.songs.length;
  const songsWord = `${count} ${count === 1 ? "song" : "songs"}`;
  const subtitle =
    tags.length > 0
      ? `Because you like ${listWords(tags.map(tagLabel))}. ${songsWord} picked for you.`
      : `${songsWord} picked from what you listen to.`;
  return { title: mixTitle(result.songs), subtitle, tags };
};
