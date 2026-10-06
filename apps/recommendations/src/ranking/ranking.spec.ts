import { SongTags, TAG_VECTOR_KEYS } from '@platform/contracts';
import { Candidate, parseWeights, rank, reasonTags } from './ranking';

const WEIGHTS = { content: 0.6, collaborative: 0.3, popularity: 0.1 };

const tags = (
  mood: SongTags['mood'],
  topics: SongTags['topics'],
): SongTags => ({
  mood,
  topics,
  energy: 'low',
  language: 'en',
});

const candidate = (
  patch: Partial<Candidate> & { song_id: number },
): Candidate => ({
  tags: null,
  content: 0,
  collaborative: 0,
  popularity: 0,
  uploaded_at: new Date('2026-10-01T00:00:00Z'),
  ...patch,
});

/** a profile vector liking the given "group:value" keys */
const profile = (liked: Record<string, number>) =>
  TAG_VECTOR_KEYS.map((key) => liked[key] ?? 0);

describe('rank', () => {
  it('orders by the weighted sum of the three signals', () => {
    const items = rank(
      [
        candidate({ song_id: 1, content: 0.9 }), // 0.54
        candidate({ song_id: 2, collaborative: 1 }), // 0.3
        candidate({ song_id: 3, popularity: 1 }), // 0.1
        candidate({ song_id: 4, content: 0.5, collaborative: 0.5 }), // 0.45
      ],
      WEIGHTS,
      null,
      10,
    );

    expect(items.map((item) => item.song_id)).toEqual([1, 4, 2, 3]);
    expect(items[0]).toMatchObject({
      score: 0.54,
      components: { content: 0.9, collaborative: 0, popularity: 0 },
    });
  });

  it('respects the limit and prefers newer tracks on equal scores', () => {
    const items = rank(
      [
        candidate({ song_id: 1, uploaded_at: new Date('2026-01-01') }),
        candidate({ song_id: 2, uploaded_at: new Date('2026-09-01') }),
        candidate({ song_id: 3, uploaded_at: null }),
      ],
      WEIGHTS,
      null,
      2,
    );

    expect(items.map((item) => item.song_id)).toEqual([2, 1]);
  });

  it('pushes tracks with disliked tags down (negative content)', () => {
    const items = rank(
      [
        candidate({ song_id: 1, content: -0.8, popularity: 1 }),
        candidate({ song_id: 2, popularity: 0.2 }),
      ],
      WEIGHTS,
      null,
      10,
    );

    expect(items.map((item) => item.song_id)).toEqual([2, 1]);
  });

  it('explains every item', () => {
    const [byTaste, byListeners, byPopularity] = rank(
      [
        candidate({
          song_id: 1,
          content: 0.8,
          tags: tags(['melancholic', 'happy'], ['love', 'party']),
        }),
        candidate({ song_id: 2, collaborative: 0.6 }),
        candidate({ song_id: 3, popularity: 1 }),
      ],
      WEIGHTS,
      profile({
        'mood:melancholic': 0.7,
        'topics:love': 0.4,
        'mood:happy': -0.5,
      }),
      10,
    );

    expect(byTaste.reasons).toEqual({
      tags: ['mood:melancholic', 'topics:love'],
      similar_listeners: false,
      popular: false,
    });
    expect(byListeners.reasons).toMatchObject({
      similar_listeners: true,
      popular: false,
    });
    expect(byPopularity.reasons).toMatchObject({ tags: [], popular: true });
  });
});

describe('reasonTags', () => {
  it('names at most three tags of the track the reference values most', () => {
    expect(
      reasonTags(
        tags(['sad', 'dark'], ['love', 'war']),
        profile({
          'mood:sad': 0.2,
          'mood:dark': 0.9,
          'topics:love': 0.5,
          'topics:war': 0.3,
          'energy:low': 0.05, // too weak to mention
        }),
      ),
    ).toEqual(['mood:dark', 'topics:love', 'topics:war']);
  });

  it('does not name the language, and energy only when nothing else matches', () => {
    const reference = profile({
      'language:en': 0.9,
      'energy:low': 0.6,
      'topics:love': 0.3,
    });

    expect(reasonTags(tags(['sad'], ['love']), reference)).toEqual([
      'topics:love',
    ]);
    expect(reasonTags(tags(['sad'], ['war']), reference)).toEqual([
      'energy:low',
    ]);
  });

  it('has nothing to say without tags or a reference', () => {
    expect(reasonTags(null, profile({}))).toEqual([]);
    expect(reasonTags(tags(['sad'], ['love']), null)).toEqual([]);
  });
});

describe('parseWeights', () => {
  const defaults = { content: 0.6, collaborative: 0.3, popularity: 0.1 };

  it('reads "content,collaborative,popularity"', () => {
    expect(parseWeights('0,0,1', defaults)).toEqual({
      content: 0,
      collaborative: 0,
      popularity: 1,
    });
  });

  it('keeps the defaults for a missing or malformed value', () => {
    expect(parseWeights(undefined, defaults)).toBe(defaults);
    expect(parseWeights('1,2', defaults)).toBe(defaults);
    expect(parseWeights('a,b,c', defaults)).toBe(defaults);
  });
});
