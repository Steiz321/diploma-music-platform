import { RecommendationsResponse } from '@platform/contracts';

/** Client of the Recommendations service. Rejects on error or timeout. */
export interface RecommendationsServiceInterface {
  forUser(userId: number, limit: number): Promise<RecommendationsResponse>;

  similarTo(songId: number, limit: number): Promise<RecommendationsResponse>;
}

export const RecommendationsServiceInterfaceType = Symbol.for(
  'RecommendationsServiceInterface',
);
