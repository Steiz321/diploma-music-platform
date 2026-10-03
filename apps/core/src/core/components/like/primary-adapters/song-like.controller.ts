import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/application/guards/auth.guard';
import CreateSongLikeUseCase from '../application/usecase/create-song-like.usecase';
import { CreateSongLikeRequest } from '../application/data/request/create-song-like.request';
import { UserAuth } from '../../auth/application/decorators/user-auth.decorator';
import { UserAuthRequestObject } from '../../auth/application/decorators/user-auth.decorator';
import { StatusResponse } from 'src/core/shared-kernel/rest/dto/status-response.dto';
import { ApiResponseDoc } from 'src/core/shared-kernel/rest/dto/api-response.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('song-like')
@UseGuards(AuthGuard)
export class SongLikeController {
  constructor(private readonly createSongLikeUseCase: CreateSongLikeUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Create a song like' })
  @ApiResponseDoc(StatusResponse)
  async createSongLike(
    @Body() body: CreateSongLikeRequest,
    @UserAuth() userAuth: UserAuthRequestObject,
  ) {
    return this.createSongLikeUseCase.execute({
      songId: body.songId,
      userId: userAuth.user_id,
    });
  }
}
