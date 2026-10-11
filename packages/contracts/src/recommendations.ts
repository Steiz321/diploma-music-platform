/** Implicit score of one track for a user (computed by Analytics). */
export interface SongScore {
  song_id: number;
  score: number;
}

export interface ScoresUpdatedPayload {
  user_id: number;
  /** every track the user interacted with that has a non-zero score */
  scores: SongScore[];
}

/** Why a track was recommended. */
export interface RecommendationReasons {
  /** "group:value" tags of the track the user's profile likes */
  tags: string[];
  /** liked by listeners with a similar taste */
  similar_listeners: boolean;
  /** recommended (also) because it is popular */
  popular: boolean;
}

export interface Recommendation {
  song_id: number;
  /** final rank score */
  score: number;
  components: {
    content: number;
    collaborative: number;
    popularity: number;
  };
  reasons: RecommendationReasons;
}

/** Response of the Recommendations service HTTP API (used by Core). */
export interface RecommendationsResponse {
  items: Recommendation[];
  /** cold start: no profile and no scores yet, ranked by popularity */
  cold_start: boolean;
}
