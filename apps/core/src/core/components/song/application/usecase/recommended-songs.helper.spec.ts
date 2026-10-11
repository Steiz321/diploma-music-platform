import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { RecommendationsResponse } from '@platform/contracts';
import { SongRepository } from '../../ports/song.repository';
import { recommendOrFallback } from './recommended-songs.helper';

const song = (id: number) => ({
  id,
  name: `Song ${id}`,
  cover_url: 'c',
  user_id: 9,
  audio: 'a',
  listens: id,
  created_at: new Date(),
  user: { id: 9, username: 'author', avatar: 'av' },
});

const reasons = {
  tags: ['mood:sad'],
  similar_listeners: false,
  popular: false,
};

const response = (ids: number[]): RecommendationsResponse => ({
  items: ids.map((song_id) => ({
    song_id,
    score: 0.5,
    components: { content: 0.8, collaborative: 0, popularity: 0 },
    reasons,
  })),
  cold_start: false,
});

describe('recommendOrFallback', () => {
  let songRepository: jest.Mocked<SongRepository>;
  let queryBus: QueryBus;
  const popular = jest.fn();

  beforeAll(() => Logger.overrideLogger(false));

  beforeEach(() => {
    songRepository = {
      getByIds: jest.fn(async (ids: number[]) => ids.map(song)),
    } as unknown as jest.Mocked<SongRepository>;
    queryBus = {
      execute: jest.fn().mockResolvedValue(false),
    } as unknown as QueryBus;
    popular.mockReset().mockResolvedValue([song(100), song(101)]);
  });

  const run = (request: () => Promise<RecommendationsResponse>) =>
    recommendOrFallback({
      logger: new Logger('test'),
      request,
      songRepository,
      queryBus,
      userId: 5,
      popular,
    });

  it('returns the recommended songs in the service order, with reasons', async () => {
    const result = await run(async () => response([3, 1, 2]));

    expect(result.source).toBe('recommendations');
    expect(result.songs.map((s) => s.id)).toEqual([3, 1, 2]);
    expect(result.songs[0]).toMatchObject({ reasons, is_liked: false });
    expect(popular).not.toHaveBeenCalled();
  });

  it('falls back to popular songs when the service fails or times out', async () => {
    const result = await run(async () => {
      throw new DOMException(
        'The operation was aborted due to timeout',
        'TimeoutError',
      );
    });

    expect(result).toMatchObject({ source: 'popular', cold_start: false });
    expect(result.songs.map((s) => s.id)).toEqual([100, 101]);
    expect(result.songs[0].reasons).toBeNull();
  });

  it('falls back when there is nothing to recommend or all were deleted', async () => {
    await expect(run(async () => response([]))).resolves.toMatchObject({
      source: 'popular',
    });

    songRepository.getByIds.mockResolvedValue([]);
    await expect(run(async () => response([7]))).resolves.toMatchObject({
      source: 'popular',
    });
  });
});
