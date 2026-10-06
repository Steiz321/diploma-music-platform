import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TAG_VECTOR_KEYS } from '@platform/contracts';
import { AnalyticsRepository } from '../common/analytics.repository';

/**
 * Debug view of a user's profile for the demo. It has no authentication, so
 * it exists only when ANALYTICS_DEBUG_ENDPOINTS=true (development); like the
 * other new services, Analytics is not exposed to the client.
 */
@Controller('profiles')
export class ProfilesController {
  private readonly enabled: boolean;

  constructor(
    private readonly repository: AnalyticsRepository,
    configService: ConfigService,
  ) {
    this.enabled = configService.get<boolean>('node.debugEndpoints');
  }

  @Get(':userId')
  async get(@Param('userId', ParseIntPipe) userId: number) {
    if (!this.enabled) {
      // indistinguishable from a route that does not exist
      throw new NotFoundException();
    }

    const { profile, scores, sessions } =
      await this.repository.profileView(userId);
    const vector = (profile?.vector as number[] | null) ?? null;

    return {
      user_id: userId,
      pending: profile?.pending ?? false,
      computed_at: profile?.computed_at ?? null,
      published_at: profile?.published_at ?? null,
      top_tags: profile?.top_tags ?? null,
      scored_songs: profile?.scored_songs ?? 0,
      // non-zero preferences only, strongest first
      preferences: vector
        ? TAG_VECTOR_KEYS.map((key, i) => ({ key, value: vector[i] }))
            .filter(({ value }) => value !== 0)
            .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        : [],
      sessions,
      scores,
    };
  }
}
