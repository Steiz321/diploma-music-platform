import type { StructuredLyrics, VerseKind } from "../api/song";

export interface FlatLine {
  start: number;
  end: number;
  text: string;
  verseIndex: number;
  kind: VerseKind;
}

/** All lines of the lyrics in playback order, each with its verse. */
export const flattenLyrics = (lyrics: StructuredLyrics): FlatLine[] =>
  lyrics.verses.flatMap((verse, verseIndex) =>
    verse.lines.map((line) => ({
      start: line.start,
      end: line.end,
      text: line.text,
      verseIndex,
      kind: verse.kind,
    }))
  );

/**
 * Index of the line being sung at `time` (seconds): the last line that has
 * started. Between two lines (and after the last one) the previous line stays
 * active; before the first line it is -1. `lines` must be sorted by start.
 */
export const findActiveLine = (
  lines: ReadonlyArray<{ start: number }>,
  time: number
): number => {
  let low = 0;
  let high = lines.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lines[mid].start <= time) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found;
};
