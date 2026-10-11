/** Where the user started playing from (the queue's origin). */
export const PLAYBACK_SOURCE_TYPES = [
  'feed',
  'playlist',
  'profile',
  'liked',
  'song_page',
  'recommendations',
] as const;

export type PlaybackSourceType = (typeof PLAYBACK_SOURCE_TYPES)[number];

export interface PlaybackSource {
  type: PlaybackSourceType;
  /** playlist / profile id when the source has one */
  id?: number;
}

/**
 * Common payload of player events. One play_id per listening session of a
 * track (from start to completed / skipped), so Analytics can stitch the
 * events of a session together.
 */
export interface PlaybackPayload {
  play_id: string;
  song_id: number;
  /** playback position at the moment of the event, seconds */
  position_sec: number;
  /** track duration when known, seconds */
  duration_sec: number | null;
  source: PlaybackSource;
}

export interface PlaybackSeekedPayload extends PlaybackPayload {
  from_sec: number;
  to_sec: number;
}
