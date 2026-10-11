import { Inject, Injectable, Logger } from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import {
  RecommendationsServiceInterface,
  RecommendationsServiceInterfaceType,
} from 'src/core/shared-kernel/ports/recommendations-service.interface';
import { GetUserTasteResponse } from '../data/response/get-user-taste.response';

interface GetUserTasteArguments {
  userId: number;
}

/** Taste profile is optional: if the Recommendations service fails, it is just absent. */
@Injectable()
export default class GetUserTasteUseCase
  implements UseCase<GetUserTasteArguments, GetUserTasteResponse>
{
  private readonly logger = new Logger(GetUserTasteUseCase.name);

  constructor(
    @Inject(RecommendationsServiceInterfaceType)
    private readonly recommendations: RecommendationsServiceInterface,
  ) {}

  async execute({
    userId,
  }: GetUserTasteArguments): Promise<GetUserTasteResponse> {
    try {
      return await this.recommendations.tasteOf(userId);
    } catch (err: unknown) {
      this.logger.warn(
        `Taste unavailable: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
      return { taste: null };
    }
  }
}
