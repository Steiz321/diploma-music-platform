import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { RecommendationsResponse } from '@platform/contracts';
import { RecommendationsService } from './recommendations.service';

const MAX_LIMIT = 50;

const clampLimit = (limit: number) => Math.min(Math.max(limit, 1), MAX_LIMIT);

/**
 * Internal API, called by Core only (Core authenticates the user and falls
 * back to popular tracks when this service does not answer in time).
 */
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Get('users/:userId')
  forUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<RecommendationsResponse> {
    return this.recommendations.forUser(userId, clampLimit(limit));
  }

  @Get('songs/:songId/similar')
  similarTo(
    @Param('songId', ParseIntPipe) songId: number,
    @Query('limit', new DefaultValuePipe(6), ParseIntPipe) limit: number,
  ): Promise<RecommendationsResponse> {
    return this.recommendations.similarTo(songId, clampLimit(limit));
  }
}
