import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import { FileObjectName } from 'src/core/shared-kernel/secondary-adapters/s3/data/enum/file-object-name.enum';
import {
  S3ServiceInterface,
  S3ServiceInterfaceType,
} from 'src/core/shared-kernel/ports/s3-service.interface';
import {
  PlaylistRepository,
  PlaylistRepositoryType,
} from '../../ports/playlist.repository';
import {
  SongToPlaylistRepository,
  SongToPlaylistRepositoryType,
} from '../../ports/song-to-playlist.repository';
import { UpdatePlaylistRequest } from '../data/request/update-playlist.request';
import { CreatePlaylistResponse } from '../data/response/create-playlist.response';
import { PlaylistUpdateParams } from '../../secondary-adapters/postgres/query-params/playlist/update-playlist.params';

interface UpdatePlaylistArguments {
  playlistId: number;
  params: UpdatePlaylistRequest;
  userId: number;
  cover?: Express.Multer.File;
}

@Injectable()
export default class UpdatePlaylistUseCase
  implements UseCase<UpdatePlaylistArguments, CreatePlaylistResponse>
{
  constructor(
    @Inject(PlaylistRepositoryType)
    private readonly playlistRepository: PlaylistRepository,
    @Inject(SongToPlaylistRepositoryType)
    private readonly songToPlaylistRepository: SongToPlaylistRepository,
    @Inject(S3ServiceInterfaceType)
    private readonly s3Service: S3ServiceInterface,
  ) {}

  public async execute({
    playlistId,
    params,
    userId,
    cover,
  }: UpdatePlaylistArguments): Promise<CreatePlaylistResponse> {
    const playlist = await this.playlistRepository.getOneWhere({
      id: playlistId,
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.user_id !== userId) {
      throw new ForbiddenException('You are not allowed to edit this playlist');
    }

    // only the fields present in the request are changed
    const what: PlaylistUpdateParams = {};
    if (params.title !== undefined) what.title = params.title;
    if (params.description !== undefined) {
      what.description = params.description;
    }
    if (params.is_private !== undefined) what.is_private = params.is_private;

    if (cover) {
      const formattedCoverFileName = this.s3Service.formatFileName(
        cover.originalname,
        FileObjectName.cover,
      );

      what.cover_url = (
        await this.s3Service.uploadFile(cover, formattedCoverFileName, [
          FileObjectName.cover,
        ])
      ).url;
    }

    const updated = Object.keys(what).length
      ? await this.playlistRepository.update(what, { id: playlistId })
      : playlist;

    const songs = await this.songToPlaylistRepository.getAllWhere({
      playlist_id: playlistId,
    });

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      cover_url: updated.cover_url,
      user_id: updated.user_id,
      songs_count: songs.length,
      is_private: updated.is_private,
      created_at: updated.created_at,
      deleted_at: updated.deleted_at,
    };
  }
}
