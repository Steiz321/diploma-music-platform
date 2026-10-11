import type { RecommendationReasons } from "../api/song";

const LANGUAGES: Record<string, string> = { uk: "Ukrainian", en: "English" };

/** "mood:self_discovery" -> "self discovery", "energy:low" -> "low energy" */
export const tagLabel = (key: string): string => {
  const [group, value] = key.split(":");
  const words = value.replace(/_/g, " ");
  if (group === "energy") return `${words} energy`;
  if (group === "language") return LANGUAGES[value] ?? "other language";
  return words;
};

/**
 * One line explaining a recommendation. "for-you": the tags are ones the
 * user's profile likes; "similar": tags shared with the track on the page.
 */
export const describeReasons = (
  reasons: RecommendationReasons | null,
  kind: "for-you" | "similar"
): string => {
  if (!reasons || (reasons.popular && reasons.tags.length === 0)) {
    return "Popular right now";
  }
  if (reasons.tags.length > 0) {
    const tags = reasons.tags.map(tagLabel).join(", ");
    return kind === "for-you" ? `Because you like ${tags}` : `Also ${tags}`;
  }
  if (reasons.similar_listeners) {
    return kind === "for-you"
      ? "Liked by listeners with a similar taste"
      : "Liked by the same listeners";
  }
  return "Popular right now";
};
