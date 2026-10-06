import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RecommendationsResponse } from '@platform/contracts';
import { RequestContext, REQUEST_ID_HEADER } from '@platform/messaging';
import { RecommendationsServiceInterface } from '../../ports/recommendations-service.interface';
import { RecommendationsConfig } from 'src/core/configuration/config.type';

/**
 * Synchronous HTTP call to the Recommendations service with a short timeout:
 * a slow or failed call must not slow the feed down (Core falls back to
 * popular tracks).
 */
@Injectable()
export class HttpRecommendationsService
  implements RecommendationsServiceInterface
{
  private readonly config: RecommendationsConfig;

  constructor(configService: ConfigService) {
    this.config = configService.get<RecommendationsConfig>('recommendations');
  }

  forUser(userId: number, limit: number): Promise<RecommendationsResponse> {
    return this.get(`/recommendations/users/${userId}?limit=${limit}`);
  }

  similarTo(songId: number, limit: number): Promise<RecommendationsResponse> {
    return this.get(`/recommendations/songs/${songId}/similar?limit=${limit}`);
  }

  private async get(path: string): Promise<RecommendationsResponse> {
    const requestId = RequestContext.requestId();
    const response = await fetch(`${this.config.url}${path}`, {
      // the same request id in the logs of both services
      headers: requestId ? { [REQUEST_ID_HEADER]: requestId } : {},
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });
    if (!response.ok) {
      throw new Error(`Recommendations answered ${response.status}`);
    }
    return (await response.json()) as RecommendationsResponse;
  }
}
