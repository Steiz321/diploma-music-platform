import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  RecommendationReasons,
  RecommendationsResponse,
} from '@platform/contracts';
import { CheckSongLikeQuery } from 'src/core/components/like/application/query-handler/check-song-like/check-song-like.query';
import { Song } from '../data/song.dto';
import {
  RecommendedSong,
  RecommendedSongsResponse,
} from '../data/response/recommended-songs.response';
import { SongRepository } from '../../ports/song.repository';

/**
 * Asks the Recommendations service; on an error, a timeout or an empty answer
 * returns popular songs instead, so the feed never depends on it.
 */
export const recommendOrFallback = async ({
  logger,
  request,
  songRepository,
  queryBus,
  userId,
  popular,
}: {
  logger: Logger;
  request: () => Promise<RecommendationsResponse>;
  songRepository: SongRepository;
  queryBus: QueryBus;
  userId: number;
  popular: () => Promise<Song[]>;
}): Promise<RecommendedSongsResponse> => {
  let recommended: RecommendationsResponse | null = null;
  try {
    recommended = await request();
  } catch (err) {
    logger.warn(
      `Recommendations unavailable, popular fallback: ${err.message}`,
    );
  }

  if (recommended?.items.length) {
    const reasons = new Map<number, RecommendationReasons>(
      recommended.items.map((item) => [item.song_id, item.reasons]),
    );
    // songs Core no longer has (deleted meanwhile) are dropped
    const songs = await songRepository.getByIds(
      recommended.items.map((item) => item.song_id),
    );
    if (songs.length) {
      return {
        songs: await withLikes(songs, userId, queryBus, reasons),
        source: 'recommendations',
        cold_start: recommended.cold_start,
      };
    }
  }

  return {
    songs: await withLikes(await popular(), userId, queryBus, null),
    source: 'popular',
    cold_start: recommended?.cold_start ?? false,
  };
};

const withLikes = (
  songs: Song[],
  userId: number,
  queryBus: QueryBus,
  reasons: Map<number, RecommendationReasons> | null,
): Promise<RecommendedSong[]> =>
  Promise.all(
    songs.map(async (song) => ({
      id: song.id,
      name: song.name,
      cover_url: song.cover_url,
      user_id: song.user_id,
      audio: song.audio,
      listens: song.listens,
      is_liked: await queryBus.execute(new CheckSongLikeQuery(userId, song.id)),
      created_at: song.created_at,
      user: {
        id: song.user.id,
        username: song.user.username,
        avatar: song.user.avatar,
      },
      reasons: reasons?.get(song.id) ?? null,
    })),
  );
