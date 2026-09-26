import { TranscriptionSegment } from '../ports/transcription-service.interface';

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

// Song text from transcription segments: one segment per line,
// an empty line between stanzas (pause > 3 s).
export const buildLyrics = (segments: TranscriptionSegment[]): string => {
  const lines: string[] = [];
  let previous: TranscriptionSegment | null = null;

  for (const segment of segments) {
    const text = segment.text.trim();

    if (!text || isArtifact(segment, text)) {
      continue;
    }

    if (previous && segment.start - previous.end > STANZA_PAUSE_SECONDS) {
      lines.push('');
    }

    lines.push(text);
    previous = segment;
  }

  return lines.join('\n');
};
