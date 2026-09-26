import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/application/guards/auth.guard';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDoc } from 'src/core/shared-kernel/rest/dto/api-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  UserAuth,
  UserAuthRequestObject,
} from '../../auth/application/decorators/user-auth.decorator';
import { TransformFilePipe } from 'src/core/shared-kernel/pipe/transform-file.pipe';
import CreatePlaylistUseCase from '../application/usecase/create-playlist.usecase';
import GetPlaylistByIdUseCase from '../application/usecase/get-playlist-by-id.usecase';
import { CreatePlaylistRequest } from '../application/data/request/create-playlist.request';
import { CreatePlaylistResponse } from '../application/data/response/create-playlist.response';
import { GetPlaylistByIdResponse } from '../application/data/response/get-playlist-by-id.response';
import { StatusResponse } from 'src/core/shared-kernel/rest/dto/status-response.dto';
import { AddSongToPlaylistRequest } from '../application/data/request/add-song-to-playlist.request';
import AddSongToPlaylistUseCase from '../application/usecase/add-song-to-playlist.usecase';
import { GetAllPlaylistsResponse } from '../application/data/response/get-all-playlists.response';
import GetAllPlaylistsUseCase from '../application/usecase/get-all-playlists.usecase';
import GetPlaylistsByUserIdUseCase from '../application/usecase/get-playlists-by-user.usecase';
import DeletePlaylistUseCase from '../application/usecase/delete-playlist.usecase';

@Controller('playlist')
@ApiTags('Playlist')
@UseGuards(AuthGuard)
export class PlaylistController {
  constructor(
    private readonly createPlaylistUseCase: CreatePlaylistUseCase,
    private readonly getPlaylistByIdUseCase: GetPlaylistByIdUseCase,
    private readonly addSongToPlaylistUseCase: AddSongToPlaylistUseCase,
    private readonly getAllPlaylistsUseCase: GetAllPlaylistsUseCase,
    private readonly getPlaylistsByUserIdUseCase: GetPlaylistsByUserIdUseCase,
    private readonly deletePlaylistUseCase: DeletePlaylistUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all playlists' })
  @ApiResponseDoc(GetAllPlaylistsResponse)
  async getAllPlaylists(
    @UserAuth() userAuth: UserAuthRequestObject,
  ): Promise<GetAllPlaylistsResponse> {
    return this.getAllPlaylistsUseCase.execute({
      userId: userAuth.user_id,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a playlist' })
  @ApiResponseDoc(CreatePlaylistResponse)
  @UseInterceptors(FileInterceptor('cover'))
  @ApiConsumes('multipart/form-data', 'application/json')
  async createPlaylist(
    @UserAuth() userAuth: UserAuthRequestObject,
    @Body() dto: CreatePlaylistRequest,
    @UploadedFile(new TransformFilePipe({ isRequired: true }))
    cover: Express.Multer.File,
  ): Promise<CreatePlaylistResponse> {
    return this.createPlaylistUseCase.execute({
      params: dto,
      userId: userAuth.user_id,
      cover,
    });
  }

  @Get('user/:id')
  @ApiOperation({ summary: 'Get all playlists by user id' })
  @ApiResponseDoc(GetAllPlaylistsResponse)
  async getPlaylistsByUserId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetAllPlaylistsResponse> {
    return this.getPlaylistsByUserIdUseCase.execute({ userId: id });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a playlist by id' })
  @ApiResponseDoc(GetPlaylistByIdResponse)
  async getPlaylistById(
    @Param('id', ParseIntPipe) id: number,
    @UserAuth() userAuth: UserAuthRequestObject,
  ): Promise<GetPlaylistByIdResponse> {
    return this.getPlaylistByIdUseCase.execute({
      playlistId: id,
      userId: userAuth.user_id,
    });
  }

  @Post(':id/song')
  @ApiOperation({ summary: 'Add a song to a playlist' })
  @ApiResponseDoc(StatusResponse)
  async addSongToPlaylist(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddSongToPlaylistRequest,
    @UserAuth() userAuth: UserAuthRequestObject,
  ): Promise<StatusResponse> {
    return this.addSongToPlaylistUseCase.execute({
      playlistId: id,
      songId: dto.songId,
      userId: userAuth.user_id,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a playlist' })
  @ApiResponseDoc(StatusResponse)
  async deletePlaylist(
    @Param('id', ParseIntPipe) id: number,
    @UserAuth() userAuth: UserAuthRequestObject,
  ): Promise<StatusResponse> {
    return this.deletePlaylistUseCase.execute({
      playlistId: id,
      userId: userAuth.user_id,
    });
  }
}
