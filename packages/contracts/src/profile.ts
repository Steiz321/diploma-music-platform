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
