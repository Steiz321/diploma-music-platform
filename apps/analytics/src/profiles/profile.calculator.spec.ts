import { SongTags, TAG_VECTOR_KEYS } from '@platform/contracts';
import { buildProfile, profileChanged } from './profile.calculator';

const tags = (patch: Partial<SongTags>): SongTags => ({
  mood: ['calm'],
  topics: ['nature'],
  energy: 'low',
  language: 'en',
  ...patch,
});

const valueOf = (vector: number[], key: string) =>
  vector[TAG_VECTOR_KEYS.indexOf(key)];

describe('buildProfile', () => {
  it('weights tags by score and normalises to -1…+1', () => {
    const profile = buildProfile([
      {
        score: 6,
        tags: tags({ mood: ['sad'], topics: ['love'], energy: 'low' }),
      },
      {
        score: 2,
        tags: tags({ mood: ['sad', 'dark'], topics: ['war'], energy: 'high' }),
      },
    ]);

    expect(valueOf(profile.vector, 'mood:sad')).toBe(1); // (6 + 2) / 8
    expect(valueOf(profile.vector, 'topics:love')).toBe(0.75);
    expect(valueOf(profile.vector, 'mood:dark')).toBe(0.25);
    expect(valueOf(profile.vector, 'mood:happy')).toBe(0);
    expect(profile.top_tags).toEqual({
      mood: ['sad', 'dark'],
      topics: ['love', 'war'],
      energy: 'low',
    });
    expect(profile.scored_songs).toBe(2);
  });

  it('lets disliked songs pull their tags below zero', () => {
    const profile = buildProfile([
      { score: 3, tags: tags({ mood: ['happy'] }) },
      { score: -6, tags: tags({ mood: ['angry'] }) },
    ]);

    expect(valueOf(profile.vector, 'mood:happy')).toBeCloseTo(0.3333, 4);
    expect(valueOf(profile.vector, 'mood:angry')).toBeCloseTo(-0.6667, 4);
    expect(profile.top_tags.mood).toEqual(['happy']);
  });

  it('ignores songs without tags or with a zero score', () => {
    const profile = buildProfile([
      { score: 4, tags: null },
      { score: 0, tags: tags({}) },
    ]);

    expect(profile.vector.every((value) => value === 0)).toBe(true);
    expect(profile.scored_songs).toBe(0);
    expect(profile.top_tags).toEqual({ mood: [], topics: [], energy: null });
  });
});

describe('profileChanged', () => {
  it('publishes a new profile and noticeable changes only', () => {
    expect(profileChanged(null, [0.5], 0.01)).toBe(true);
    expect(profileChanged([0.5], [0.505], 0.01)).toBe(false);
    expect(profileChanged([0.5], [0.52], 0.01)).toBe(true);
  });
});
