import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/application/guards/auth.guard';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { ApiResponseDoc } from 'src/core/shared-kernel/rest/dto/api-response.dto';
import { CreateSongResponse } from '../application/data/response/create-song.response';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  UserAuth,
  UserAuthRequestObject,
} from '../../auth/application/decorators/user-auth.decorator';
import { CreateSongRequest } from '../application/data/request/create-song.request';
import CreateSongUseCase from '../application/usecase/create-song.usecase';
import { GetAllSongsResponse } from '../application/data/response/get-all-songs.response';
import GetAllSongsUseCase from '../application/usecase/get-all-songs.usecase';
import { GetSongByIdResponse } from '../application/data/response/get-song-by-id.response';
import GetSongByIdUseCase from '../application/usecase/get-song-by-id.usecase';
import { StatusResponse } from 'src/core/shared-kernel/rest/dto/status-response.dto';
import CreateListenForSongUseCase from '../application/usecase/create-listen-for-song.usecase';
import DeleteSongUseCase from '../application/usecase/delete-song.usecase';

@Controller('song')
@UseGuards(AuthGuard)
export class SongController {
  constructor(
    private readonly createSongUseCase: CreateSongUseCase,
    private readonly getAllSongsUseCase: GetAllSongsUseCase,
    private readonly getSongByIdUseCase: GetSongByIdUseCase,
    private readonly createListenForSongUseCase: CreateListenForSongUseCase,
    private readonly deleteSongUseCase: DeleteSongUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a song' })
  @ApiResponseDoc(CreateSongResponse)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'audio', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data', 'application/json')
  async createSong(
    @UserAuth() userAuth: UserAuthRequestObject,
    @Body() dto: CreateSongRequest,
    @UploadedFiles()
    files: { audio?: Express.Multer.File[]; cover?: Express.Multer.File[] },
  ): Promise<CreateSongResponse> {
    const audio = files?.audio?.[0];
    if (!audio) {
      throw new BadRequestException('Audio file is required');
    }

    return this.createSongUseCase.execute({
      audio,
      params: dto,
      userId: userAuth.user_id,
      cover: files?.cover?.[0],
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all songs' })
  @ApiResponseDoc(GetAllSongsResponse)
  async getAllSongs(
    @Query('search') search: string,
    @UserAuth() userAuth: UserAuthRequestObject,
  ): Promise<GetAllSongsResponse> {
    return this.getAllSongsUseCase.execute({
      search,
      userId: userAuth.user_id,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a song by id' })
  @ApiResponseDoc(GetSongByIdResponse)
  async getSongById(
    @Param('id', ParseIntPipe) id: number,
    @UserAuth() userAuth: UserAuthRequestObject,
  ): Promise<GetSongByIdResponse> {
    return this.getSongByIdUseCase.execute({ id, userId: userAuth.user_id });
  }

  @Post(':id/listen')
  @ApiOperation({ summary: 'Create a listen for a song' })
  @ApiResponseDoc(StatusResponse)
  async createListenForSong(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StatusResponse> {
    return this.createListenForSongUseCase.execute({ songId: id });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a song' })
  @ApiResponseDoc(StatusResponse)
  async deleteSong(
    @Param('id', ParseIntPipe) id: number,
    @UserAuth() userAuth: UserAuthRequestObject,
  ): Promise<StatusResponse> {
    return this.deleteSongUseCase.execute({
      songId: id,
      userId: userAuth.user_id,
    });
  }
}
