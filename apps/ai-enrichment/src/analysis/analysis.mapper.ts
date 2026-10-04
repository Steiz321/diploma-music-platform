import {
  LanguageTag,
  normalizeTags,
  SongTags,
  StructuredLyrics,
  TranscriptionSegment,
  VERSE_KINDS,
  VerseKind,
} from '@platform/contracts';
import { AnalysisOutput } from './analyzer';

/** The model answered, but the answer is unusable. */
export class InvalidAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAnalysisError';
  }
}

/**
 * Lyrics with timings taken from the referenced Whisper segments. Lines that
 * refer to a missing segment or have no text are dropped.
 */
export const toStructuredLyrics = (
  output: AnalysisOutput,
  segments: TranscriptionSegment[],
): StructuredLyrics => {
  const verses = (output.verses ?? [])
    .map((verse) => ({
      kind: (VERSE_KINDS as readonly string[]).includes(verse.kind)
        ? (verse.kind as VerseKind)
        : 'other',
      lines: (verse.lines ?? [])
        .filter(
          (line) =>
            Number.isInteger(line.segment) &&
            segments[line.segment] &&
            line.text?.trim(),
        )
        .map((line) => ({
          start: segments[line.segment].start,
          end: segments[line.segment].end,
          text: line.text.trim(),
        })),
    }))
    .filter((verse) => verse.lines.length > 0);

  if (verses.length === 0) {
    throw new InvalidAnalysisError('the analysis has no lyrics lines');
  }

  return { verses };
};

/** Tags limited to the vocabulary and the 1–3 item counts. */
export const toTags = (
  output: AnalysisOutput,
  language: LanguageTag,
): SongTags => {
  const tags = normalizeTags(output.tags ?? {}, language);
  if (!tags) {
    throw new InvalidAnalysisError(
      `tags are missing or outside the vocabulary: ${JSON.stringify(output.tags)}`,
    );
  }
  return tags;
};

/** Plain text: one line per line, an empty line between verses. */
export const lyricsToText = (lyrics: StructuredLyrics): string =>
  lyrics.verses
    .map((verse) => verse.lines.map((line) => line.text).join('\n'))
    .join('\n\n');
