/** What is known about one user–song pair, aggregated from the tables. */
export interface SongFeatures {
  /** current like state; null when never liked */
  liked: boolean | null;
  /** how many of the user's playlists contain the song */
  playlists: number;
  completions: number;
  /** skips in the first 30 s */
  early_skips: number;
  /** best share heard (0–1) among sessions that neither completed nor skipped early */
  partial_ratio: number;
}

/**
 * Weights of the implicit score. Caps keep a repeated action from dominating
 * (listening to one song ten times is not ten times the preference).
 */
export const SCORE_WEIGHTS = {
  liked: 3,
  unliked: -3,
  completion: 2,
  maxCompletions: 6,
  partialListen: 2,
  earlySkip: -2,
  maxEarlySkips: -6,
  playlist: 2,
  maxPlaylists: 4,
} as const;

/** Implicit preference of a user for a song; positive = likes it. */
export const scoreSong = (features: SongFeatures): number => {
  const w = SCORE_WEIGHTS;
  const like =
    features.liked === true
      ? w.liked
      : features.liked === false
        ? w.unliked
        : 0;
  const completions = Math.min(
    features.completions * w.completion,
    w.maxCompletions,
  );
  // a partial listen only matters when the song was never heard to the end
  const partial =
    features.completions === 0 ? w.partialListen * features.partial_ratio : 0;
  const earlySkips = Math.max(
    features.early_skips * w.earlySkip,
    w.maxEarlySkips,
  );
  const playlists = Math.min(features.playlists * w.playlist, w.maxPlaylists);

  const score = like + completions + partial + earlySkips + playlists;
  return Math.round(score * 1000) / 1000;
};
