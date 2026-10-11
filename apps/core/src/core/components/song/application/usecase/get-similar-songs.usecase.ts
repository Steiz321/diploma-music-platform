import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import {
  RecommendationsServiceInterface,
  RecommendationsServiceInterfaceType,
} from 'src/core/shared-kernel/ports/recommendations-service.interface';
import {
  SongRepository,
  SongRepositoryType,
} from '../../ports/song.repository';
import { RecommendedSongsResponse } from '../data/response/recommended-songs.response';
import { recommendOrFallback } from './recommended-songs.helper';

interface GetSimilarSongsArguments {
  songId: number;
  userId: number;
  limit: number;
}

/** "Similar tracks" on the song page. */
@Injectable()
export default class GetSimilarSongsUseCase
  implements UseCase<GetSimilarSongsArguments, RecommendedSongsResponse>
{
  private readonly logger = new Logger(GetSimilarSongsUseCase.name);

  constructor(
    @Inject(RecommendationsServiceInterfaceType)
    private readonly recommendations: RecommendationsServiceInterface,
    @Inject(SongRepositoryType)
    private readonly songRepository: SongRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async execute({
    songId,
    userId,
    limit,
  }: GetSimilarSongsArguments): Promise<RecommendedSongsResponse> {
    const song = await this.songRepository.getOneWhere({ id: songId });
    if (!song) {
      throw new NotFoundException('Song not found');
    }

    return recommendOrFallback({
      logger: this.logger,
      request: () => this.recommendations.similarTo(songId, limit),
      songRepository: this.songRepository,
      queryBus: this.queryBus,
      userId,
      popular: () => this.songRepository.getPopular(limit, { songId }),
    });
  }
}
