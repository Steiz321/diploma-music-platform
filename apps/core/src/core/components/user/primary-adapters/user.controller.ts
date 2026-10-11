import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDoc } from 'src/core/shared-kernel/rest/dto/api-response.dto';
import GetUserTasteUseCase from '../application/usecase/get-user-taste.usecase';
import { GetUserTasteResponse } from '../application/data/response/get-user-taste.response';
import GetUserByIdUseCase from '../application/usecase/get-user-by-id.usecase';
import GetUsersLikedSongsUseCase from '../application/usecase/get-users-liked-songs.usecase';
import {
  UserAuth,
  UserAuthRequestObject,
} from '../../auth/application/decorators/user-auth.decorator';
import { AuthGuard } from '../../auth/application/guards/auth.guard';
import GetUsersLikedPlaylistsUseCase from '../application/usecase/get-users-liked-playlists.usecase';

@Controller('user')
@UseGuards(AuthGuard)
@ApiTags('user')
export class UserController {
  constructor(
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly getUsersLikedSongsUseCase: GetUsersLikedSongsUseCase,
    private readonly getUsersLikedPlaylistsUseCase: GetUsersLikedPlaylistsUseCase,
    private readonly getUserTasteUseCase: GetUserTasteUseCase,
  ) {}

  @Get('/liked-songs')
  async getUsersLikedSongs(@UserAuth() userAuth: UserAuthRequestObject) {
    return this.getUsersLikedSongsUseCase.execute({ userId: userAuth.user_id });
  }

  @Get('/liked-playlists')
  async getUsersLikedPlaylists(@UserAuth() userAuth: UserAuthRequestObject) {
    return this.getUsersLikedPlaylistsUseCase.execute({
      userId: userAuth.user_id,
    });
  }

  @Get('/taste')
  @ApiOperation({ summary: 'Get the taste profile of the current user' })
  @ApiResponseDoc(GetUserTasteResponse)
  async getUserTaste(@UserAuth() userAuth: UserAuthRequestObject) {
    return this.getUserTasteUseCase.execute({ userId: userAuth.user_id });
  }

  @Get('/:id')
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
    @UserAuth() userAuth: UserAuthRequestObject,
  ) {
    return this.getUserByIdUseCase.execute({
      userId: id,
      myUserId: userAuth.user_id,
    });
  }
}
