import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RecommendationsResponse } from '@platform/contracts';
import { RecommendationsRepository } from '../common/recommendations.repository';
import { rank, RankingWeights } from '../ranking/ranking';

@Injectable()
export class RecommendationsService {
  private readonly userWeights: RankingWeights;
  private readonly similarWeights: RankingWeights;

  constructor(
    private readonly repository: RecommendationsRepository,
    configService: ConfigService,
  ) {
    this.userWeights = configService.get<RankingWeights>('userWeights');
    this.similarWeights = configService.get<RankingWeights>('similarWeights');
  }

  /** "For you": hybrid ranking; popularity only on a cold start. */
  async forUser(
    userId: number,
    limit: number,
  ): Promise<RecommendationsResponse> {
    const [profile, hasScores, candidates] = await Promise.all([
      this.repository.getProfileVector(userId),
      this.repository.hasPositiveScores(userId),
      this.repository.candidatesForUser(userId),
    ]);
    const coldStart = !profile && !hasScores;

    return {
      items: rank(candidates, this.userWeights, profile, limit),
      cold_start: coldStart,
    };
  }

  /** "Similar tracks": tag similarity and co-liked tracks. */
  async similarTo(
    songId: number,
    limit: number,
  ): Promise<RecommendationsResponse> {
    const [target, candidates] = await Promise.all([
      this.repository.getTrackVector(songId),
      this.repository.candidatesSimilarTo(songId),
    ]);

    return {
      items: rank(candidates, this.similarWeights, target, limit),
      cold_start: false,
    };
  }
}
