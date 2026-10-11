import { TAG_VECTOR_KEYS } from '@platform/contracts';
import { describeTaste } from './taste';

/** a vector with the given preferences, 0 elsewhere */
const vectorOf = (values: Record<string, number>) =>
  TAG_VECTOR_KEYS.map((key) => values[key] ?? 0);

describe('describeTaste', () => {
  it('lists liked moods and topics, strongest first', () => {
    const taste = describeTaste(
      vectorOf({
        'mood:calm': 0.2,
        'mood:nostalgic': 0.5,
        'topics:memories': 0.3,
        'energy:low': 0.9,
      }),
    );

    expect(taste).toEqual({
      moods: [
        { key: 'mood:nostalgic', value: 0.5 },
        { key: 'mood:calm', value: 0.2 },
      ],
      topics: [{ key: 'topics:memories', value: 0.3 }],
    });
  });

  it('leaves out disliked and neutral tags', () => {
    const taste = describeTaste(
      vectorOf({ 'mood:calm': -0.4, 'topics:memories': 0 }),
    );

    expect(taste).toEqual({ moods: [], topics: [] });
  });

  it('keeps at most five moods and three topics', () => {
    const values = Object.fromEntries(
      TAG_VECTOR_KEYS.map((key) => [key, 0.1] as const),
    );
    const taste = describeTaste(vectorOf(values));

    expect(taste.moods).toHaveLength(5);
    expect(taste.topics).toHaveLength(3);
  });
});
