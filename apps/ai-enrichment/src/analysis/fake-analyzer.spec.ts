import { TAG_VOCABULARY, TranscriptionResult } from '@platform/contracts';
import { FakeAnalyzer } from './fake-analyzer';

const transcription: TranscriptionResult = {
  text: 'la la',
  language: 'en',
  duration: 10,
  segments: [
    { start: 0, end: 2, text: ' la la la', avgLogprob: -0.1, noSpeechProb: 0 },
  ],
};

describe('FakeAnalyzer', () => {
  const analyzer = new FakeAnalyzer(0);

  it('gives the same title the same tags', async () => {
    const a = await analyzer.analyze({ title: 'Wonderwall', transcription });
    const b = await analyzer.analyze({ title: 'Wonderwall', transcription });
    expect(a.tags).toEqual(b.tags);
  });

  it('gives different titles valid, mostly different tags', async () => {
    const titles = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'];
    const results = await Promise.all(
      titles.map((title) => analyzer.analyze({ title, transcription })),
    );

    for (const { tags } of results) {
      expect(tags.mood).toHaveLength(2);
      expect(new Set(tags.mood).size).toBe(2);
      tags.mood.forEach((mood) => expect(TAG_VOCABULARY.mood).toContain(mood));
      tags.topics.forEach((topic) =>
        expect(TAG_VOCABULARY.topics).toContain(topic),
      );
      expect(TAG_VOCABULARY.energy).toContain(tags.energy);
    }
    const distinct = new Set(results.map(({ tags }) => tags.mood.join()));
    expect(distinct.size).toBeGreaterThan(3);
  });
});
