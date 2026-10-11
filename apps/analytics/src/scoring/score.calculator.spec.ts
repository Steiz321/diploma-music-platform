import { scoreSong, SongFeatures } from './score.calculator';

const none: SongFeatures = {
  liked: null,
  playlists: 0,
  completions: 0,
  early_skips: 0,
  partial_ratio: 0,
};

describe('scoreSong', () => {
  it.each([
    ['liked', { liked: true }, 3],
    ['unliked', { liked: false }, -3],
    ['one completion', { completions: 1 }, 2],
    ['completions are capped', { completions: 10 }, 6],
    ['early skip', { early_skips: 1 }, -2],
    ['early skips are capped', { early_skips: 7 }, -6],
    ['in a playlist', { playlists: 1 }, 2],
    ['playlists are capped', { playlists: 5 }, 4],
    ['partial listen in proportion', { partial_ratio: 0.5 }, 1],
  ])('%s', (_, patch, expected) => {
    expect(scoreSong({ ...none, ...patch })).toBe(expected);
  });

  it('ignores partial listens once the song was heard to the end', () => {
    expect(scoreSong({ ...none, completions: 1, partial_ratio: 0.9 })).toBe(2);
  });

  it('adds the signals up', () => {
    // liked, saved, heard twice, skipped early once
    expect(
      scoreSong({
        liked: true,
        playlists: 1,
        completions: 2,
        early_skips: 1,
        partial_ratio: 0,
      }),
    ).toBe(3 + 2 + 4 - 2);
  });
});
