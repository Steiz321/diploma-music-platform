import { describe, expect, it } from "vitest";
import { findActiveLine, flattenLyrics } from "./activeLine";

// two lines with a gap between them (5..6), then a third one
const lines = [
  { start: 2, end: 5 },
  { start: 6, end: 9 },
  { start: 9, end: 12 },
];

describe("findActiveLine", () => {
  it("returns -1 before the first line", () => {
    expect(findActiveLine(lines, 0)).toBe(-1);
    expect(findActiveLine(lines, 1.99)).toBe(-1);
  });

  it("activates a line exactly at its start", () => {
    expect(findActiveLine(lines, 2)).toBe(0);
    expect(findActiveLine(lines, 6)).toBe(1);
  });

  it("switches to the next line at the shared boundary", () => {
    expect(findActiveLine(lines, 8.99)).toBe(1);
    expect(findActiveLine(lines, 9)).toBe(2);
  });

  it("keeps the previous line in a gap between lines", () => {
    expect(findActiveLine(lines, 5)).toBe(0);
    expect(findActiveLine(lines, 5.5)).toBe(0);
  });

  it("keeps the last line after the end", () => {
    expect(findActiveLine(lines, 12)).toBe(2);
    expect(findActiveLine(lines, 300)).toBe(2);
  });

  it("returns -1 for no lines", () => {
    expect(findActiveLine([], 10)).toBe(-1);
  });

  it("works for a single line", () => {
    expect(findActiveLine([{ start: 3 }], 2)).toBe(-1);
    expect(findActiveLine([{ start: 3 }], 3)).toBe(0);
  });
});

describe("flattenLyrics", () => {
  it("keeps the playback order and the verse of every line", () => {
    const flat = flattenLyrics({
      verses: [
        {
          kind: "verse",
          lines: [
            { start: 1, end: 2, text: "a" },
            { start: 2, end: 3, text: "b" },
          ],
        },
        { kind: "chorus", lines: [{ start: 4, end: 5, text: "c" }] },
      ],
    });
    expect(flat.map((l) => [l.text, l.verseIndex, l.kind])).toEqual([
      ["a", 0, "verse"],
      ["b", 0, "verse"],
      ["c", 1, "chorus"],
    ]);
  });
});
