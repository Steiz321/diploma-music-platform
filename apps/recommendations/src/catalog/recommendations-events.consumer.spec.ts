import { createEnvelope } from '@platform/contracts';
import { isValidRecommendationsEvent } from './recommendations-events.consumer';

const profileUpdated = (producer: string) =>
  createEnvelope(
    'profile.updated',
    {
      user_id: 5,
      vector: [],
      vocabulary_version: 1,
      top_tags: { mood: [], topics: [], energy: null },
      scored_songs: 0,
    },
    { producer },
  );

describe('RecommendationsEventsConsumer', () => {
  it('accepts profiles and scores only from Analytics', () => {
    expect(isValidRecommendationsEvent(profileUpdated('analytics'))).toBe(true);
    expect(isValidRecommendationsEvent(profileUpdated('core'))).toBe(false);
    expect(
      isValidRecommendationsEvent(
        createEnvelope(
          'scores.updated',
          { user_id: 5, scores: [] },
          { producer: 'evil' },
        ),
      ),
    ).toBe(false);
  });

  it('accepts catalogue events from their owners', () => {
    expect(
      isValidRecommendationsEvent(
        createEnvelope(
          'song.deleted',
          { song_id: 1, author_id: 2 },
          { producer: 'core' },
        ),
      ),
    ).toBe(true);
  });
});
