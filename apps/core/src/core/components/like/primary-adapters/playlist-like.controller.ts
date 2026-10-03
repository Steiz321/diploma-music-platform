import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/application/guards/auth.guard';
import { UserAuth } from '../../auth/application/decorators/user-auth.decorator';
import { UserAuthRequestObject } from '../../auth/application/decorators/user-auth.decorator';
import { StatusResponse } from 'src/core/shared-kernel/rest/dto/status-response.dto';
import { ApiResponseDoc } from 'src/core/shared-kernel/rest/dto/api-response.dto';
import { ApiOperation } from '@nestjs/swagger';
import CreatePlaylistLikeUseCase from '../application/usecase/create-playlist-like.usecase';
import { CreatePlaylistLikeRequest } from '../application/data/request/create-playlist-like.request';

@Controller('playlist-like')
@UseGuards(AuthGuard)
export class PlaylistLikeController {
  constructor(
    private readonly createPlaylistLikeUseCase: CreatePlaylistLikeUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a playlist like' })
  @ApiResponseDoc(StatusResponse)
  async createPlaylistLike(
    @Body() body: CreatePlaylistLikeRequest,
    @UserAuth() userAuth: UserAuthRequestObject,
  ) {
    return this.createPlaylistLikeUseCase.execute({
      playlistId: body.playlistId,
      userId: userAuth.user_id,
    });
  }
}
