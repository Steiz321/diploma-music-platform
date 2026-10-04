import { TranscriptionSegment } from '@platform/contracts';
import { AnalysisOutput } from './analyzer';
import {
  InvalidAnalysisError,
  lyricsToText,
  toStructuredLyrics,
  toTags,
} from './analysis.mapper';

const segment = (start: number, text: string): TranscriptionSegment => ({
  start,
  end: start + 2,
  text,
  avgLogprob: -0.2,
  noSpeechProb: 0.01,
});

const SEGMENTS = [
  segment(0, 'Today is gonna be the day'),
  segment(3, 'That they gonna throw it back to you'),
  segment(10, 'And all the roads we have to walk are winding'),
];

const output = (patch: Partial<AnalysisOutput> = {}): AnalysisOutput => ({
  instrumental: false,
  verses: [
    {
      kind: 'verse',
      lines: [
        { segment: 0, text: 'Today is gonna be the day ' },
        { segment: 1, text: 'That they gonna throw it back to you' },
      ],
    },
    { kind: 'chorus', lines: [{ segment: 2, text: 'And all the roads' }] },
  ],
  tags: { mood: ['melancholic'], topics: ['love'], energy: 'medium' },
  ...patch,
});

describe('analysis.mapper', () => {
  describe('toStructuredLyrics', () => {
    it('takes line timings from the referenced segments', () => {
      const lyrics = toStructuredLyrics(output(), SEGMENTS);

      expect(lyrics.verses).toEqual([
        {
          kind: 'verse',
          lines: [
            { start: 0, end: 2, text: 'Today is gonna be the day' },
            { start: 3, end: 5, text: 'That they gonna throw it back to you' },
          ],
        },
        {
          kind: 'chorus',
          lines: [{ start: 10, end: 12, text: 'And all the roads' }],
        },
      ]);
      expect(lyricsToText(lyrics)).toBe(
        'Today is gonna be the day\nThat they gonna throw it back to you\n\nAnd all the roads',
      );
    });

    it('drops lines with unknown segments or no text and unknown verse kinds become other', () => {
      const lyrics = toStructuredLyrics(
        output({
          verses: [
            {
              kind: 'refrain',
              lines: [
                { segment: 99, text: 'invented line' },
                { segment: 1.5, text: 'not an index' },
                { segment: 0, text: '   ' },
                { segment: 2, text: 'kept' },
              ],
            },
            { kind: 'verse', lines: [{ segment: -1, text: 'gone' }] },
          ],
        }),
        SEGMENTS,
      );

      expect(lyrics.verses).toEqual([
        { kind: 'other', lines: [{ start: 10, end: 12, text: 'kept' }] },
      ]);
    });

    it('rejects an analysis without any usable line', () => {
      expect(() =>
        toStructuredLyrics(output({ verses: [] }), SEGMENTS),
      ).toThrow(InvalidAnalysisError);
    });
  });

  describe('toTags', () => {
    it('keeps vocabulary values only, without duplicates, at most 3 per group', () => {
      const tags = toTags(
        output({
          tags: {
            mood: ['sad', 'sad', 'grumpy', 'dark', 'calm', 'dreamy'],
            topics: ['love', 'cats'],
            energy: 'high',
          },
        }),
        'en',
      );

      expect(tags).toEqual({
        mood: ['sad', 'dark', 'calm'],
        topics: ['love'],
        energy: 'high',
        language: 'en',
      });
    });

    it('rejects tags when a group ends up empty or energy is unknown', () => {
      expect(() =>
        toTags(
          output({
            tags: { mood: ['grumpy'], topics: ['love'], energy: 'low' },
          }),
          'uk',
        ),
      ).toThrow(InvalidAnalysisError);
      expect(() =>
        toTags(
          output({ tags: { mood: ['sad'], topics: ['love'], energy: 'loud' } }),
          'uk',
        ),
      ).toThrow(InvalidAnalysisError);
    });
  });
});
