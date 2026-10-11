/** Strongest preferences of a profile, for display and explanations. */
export interface ProfileTopTags {
  mood: string[];
  topics: string[];
  energy: string | null;
}

export interface ProfileUpdatedPayload {
  user_id: number;
  /**
   * Preference per tag, aligned with TAG_VECTOR_KEYS: from -1 (dislikes)
   * to +1 (likes); 0 when there is no signal.
   */
  vector: number[];
  vocabulary_version: number;
  top_tags: ProfileTopTags;
  /** how many tracks with tags and a non-zero score the profile is built from */
  scored_songs: number;
}

/** One liked tag of a profile, for display. */
export interface TastePreference {
  /** "group:value" key of TAG_VECTOR_KEYS, e.g. "mood:calm" */
  key: string;
  /** preference from the profile vector, above 0 */
  value: number;
}

/** Response of the Recommendations service taste API (used by Core). */
export interface UserTasteResponse {
  /** null when the user has no profile yet */
  taste: {
    /** liked moods, strongest first */
    moods: TastePreference[];
    /** liked topics, strongest first */
    topics: TastePreference[];
  } | null;
}
