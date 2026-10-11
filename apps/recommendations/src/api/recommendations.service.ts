import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RecommendationsResponse,
  TAG_VOCABULARY_VERSION,
  UserTasteResponse,
} from '@platform/contracts';
import { RecommendationsRepository } from '../common/recommendations.repository';
import { rank, RankingWeights } from '../ranking/ranking';
import { describeTaste } from '../taste/taste';

@Injectable()
export class RecommendationsService {
  /** configured defaults (RECOMMENDATION_WEIGHTS / SIMILAR_WEIGHTS) */
  readonly userWeights: RankingWeights;
  readonly similarWeights: RankingWeights;

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
    weights: RankingWeights = this.userWeights,
  ): Promise<RecommendationsResponse> {
    const [profile, hasScores, candidates] = await Promise.all([
      this.repository.getProfileVector(userId),
      this.repository.hasPositiveScores(userId),
      this.repository.candidatesForUser(userId),
    ]);
    const coldStart = !profile && !hasScores;

    return {
      items: rank(candidates, weights, profile, limit),
      cold_start: coldStart,
    };
  }

  /**
   * The liked moods and topics of the user's profile. Null without a
   * profile, or when it is aligned with an older tag vocabulary (its values
   * would be read against the wrong keys).
   */
  async tasteOf(userId: number): Promise<UserTasteResponse> {
    const profile = await this.repository.getProfile(userId);
    if (!profile || profile.vocabulary_version !== TAG_VOCABULARY_VERSION) {
      return { taste: null };
    }
    return { taste: describeTaste(profile.vector) };
  }

  /** "Similar tracks": tag similarity and co-liked tracks. */
  async similarTo(
    songId: number,
    limit: number,
    weights: RankingWeights = this.similarWeights,
  ): Promise<RecommendationsResponse> {
    const [target, candidates] = await Promise.all([
      this.repository.getTrackVector(songId),
      this.repository.candidatesSimilarTo(songId),
    ]);

    return {
      items: rank(candidates, weights, target, limit),
      cold_start: false,
    };
  }
}
