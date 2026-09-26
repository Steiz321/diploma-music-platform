import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
