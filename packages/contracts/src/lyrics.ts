export const VERSE_KINDS = [
  'verse',
  'chorus',
  'bridge',
  'intro',
  'outro',
  'other',
] as const;

export type VerseKind = (typeof VERSE_KINDS)[number];

export interface LyricsLine {
  /** seconds from the start of the track, taken from the Whisper segment */
  start: number;
  end: number;
  text: string;
}

export interface LyricsVerse {
  kind: VerseKind;
  lines: LyricsLine[];
}

/** Lyrics split into verses, every line with its timing. */
export interface StructuredLyrics {
  verses: LyricsVerse[];
}
