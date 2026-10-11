import {
  RecommendationsResponse,
  UserTasteResponse,
} from '@platform/contracts';

/** Client of the Recommendations service. Rejects on error or timeout. */
export interface RecommendationsServiceInterface {
  forUser(userId: number, limit: number): Promise<RecommendationsResponse>;

  similarTo(songId: number, limit: number): Promise<RecommendationsResponse>;

  /** Taste profile of the user; `taste` is null until there is listening history. */
  tasteOf(userId: number): Promise<UserTasteResponse>;
}

export const RecommendationsServiceInterfaceType = Symbol.for(
  'RecommendationsServiceInterface',
);
