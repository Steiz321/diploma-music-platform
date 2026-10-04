import { TranscriptionSegment } from '@platform/contracts';

// A pause longer than this between segments starts a new stanza
const STANZA_PAUSE_SECONDS = 3;
// Short, low-confidence segments are usually hallucinations ("you", "Thank you")
const SHORT_SEGMENT_MAX_WORDS = 2;
const MIN_SHORT_SEGMENT_AVG_LOGPROB = -1.0;

const hasLettersOrDigits = (text: string) => /[\p{L}\p{N}]/u.test(text);

const isArtifact = (segment: TranscriptionSegment, text: string): boolean => {
  // only emoji / symbols, e.g. "🎵" or "♪ ♪"
  if (!hasLettersOrDigits(text)) {
    return true;
  }

  const wordsCount = text.split(/\s+/).length;
  return (
    wordsCount <= SHORT_SEGMENT_MAX_WORDS &&
    segment.avgLogprob < MIN_SHORT_SEGMENT_AVG_LOGPROB
  );
};

/**
 * Indexes of the meaningful segments grouped into stanzas: artifacts are
 * dropped, a pause longer than 3 s between segments starts a new stanza.
 */
export const stanzaSegmentIndexes = (
  segments: TranscriptionSegment[],
): number[][] => {
  const stanzas: number[][] = [];
  let previous: TranscriptionSegment | null = null;

  segments.forEach((segment, index) => {
    const text = segment.text.trim();

    if (!text || isArtifact(segment, text)) {
      return;
    }

    if (!previous || segment.start - previous.end > STANZA_PAUSE_SECONDS) {
      stanzas.push([]);
    }

    stanzas[stanzas.length - 1].push(index);
    previous = segment;
  });

  return stanzas;
};

// Song text from transcription segments: one segment per line,
// an empty line between stanzas (pause > 3 s). Empty: no lyrics.
export const buildLyrics = (segments: TranscriptionSegment[]): string =>
  stanzaSegmentIndexes(segments)
    .map((stanza) =>
      stanza.map((index) => segments[index].text.trim()).join('\n'),
    )
    .join('\n\n');
