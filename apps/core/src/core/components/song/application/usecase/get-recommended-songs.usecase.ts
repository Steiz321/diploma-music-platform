import { Inject, Injectable, Logger } from '@nestjs/common';
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

interface GetRecommendedSongsArguments {
  userId: number;
  limit: number;
}

/** "For you" in the feed. */
@Injectable()
export default class GetRecommendedSongsUseCase
  implements UseCase<GetRecommendedSongsArguments, RecommendedSongsResponse>
{
  private readonly logger = new Logger(GetRecommendedSongsUseCase.name);

  constructor(
    @Inject(RecommendationsServiceInterfaceType)
    private readonly recommendations: RecommendationsServiceInterface,
    @Inject(SongRepositoryType)
    private readonly songRepository: SongRepository,
    private readonly queryBus: QueryBus,
  ) {}

  execute({
    userId,
    limit,
  }: GetRecommendedSongsArguments): Promise<RecommendedSongsResponse> {
    return recommendOrFallback({
      logger: this.logger,
      request: () => this.recommendations.forUser(userId, limit),
      songRepository: this.songRepository,
      queryBus: this.queryBus,
      userId,
      popular: () =>
        this.songRepository.getPopular(limit, { authorId: userId }),
    });
  }
}
