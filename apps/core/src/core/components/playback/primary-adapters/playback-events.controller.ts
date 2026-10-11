import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthGuard } from '../../auth/application/guards/auth.guard';
import {
  UserAuth,
  UserAuthRequestObject,
} from '../../auth/application/decorators/user-auth.decorator';
import { ApiResponseDoc } from 'src/core/shared-kernel/rest/dto/api-response.dto';
import { THROTTLERS } from 'src/core/shared-kernel/data/constants/throttlers.constant';
import { EventsThrottlerGuard } from '../application/guards/events-throttler.guard';
import { TrackPlaybackEventsRequest } from '../application/data/request/track-playback-events.request';
import { TrackPlaybackEventsResponse } from '../application/data/response/track-playback-events.response';
import TrackPlaybackEventsUseCase from '../application/usecase/track-playback-events.usecase';

@Controller('events')
@ApiTags('Events')
@UseGuards(AuthGuard)
export class PlaybackEventsController {
  constructor(
    private readonly trackPlaybackEventsUseCase: TrackPlaybackEventsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(EventsThrottlerGuard)
  @SkipThrottle({ [THROTTLERS.listen.name]: true })
  @ApiOperation({
    summary: 'Player events batch (published as playback.* events)',
  })
  @ApiResponseDoc(TrackPlaybackEventsResponse)
  async track(
    @Body() body: TrackPlaybackEventsRequest,
    @UserAuth() userAuth: UserAuthRequestObject,
  ): Promise<TrackPlaybackEventsResponse> {
    return this.trackPlaybackEventsUseCase.execute({
      userId: userAuth.user_id,
      events: body.events,
    });
  }
}
