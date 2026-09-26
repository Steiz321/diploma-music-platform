import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import { FileObjectName } from 'src/core/shared-kernel/secondary-adapters/s3/data/enum/file-object-name.enum';
import {
  S3ServiceInterface,
  S3ServiceInterfaceType,
} from 'src/core/shared-kernel/ports/s3-service.interface';
import { mockData } from 'src/core/shared-kernel/data/constants/mock-data.constant';
import {
  PlaylistRepository,
  PlaylistRepositoryType,
} from '../../ports/playlist.repository';
import { CreatePlaylistRequest } from '../data/request/create-playlist.request';
import { Playlist } from '../data/playlist.dto';
import { CreatePlaylistResponse } from '../data/response/create-playlist.response';

interface CreatePlaylistArguments {
  params: CreatePlaylistRequest;
  userId: number;
  cover?: Express.Multer.File;
}

@Injectable()
export default class CreatePlaylistUseCase
  implements UseCase<CreatePlaylistArguments, CreatePlaylistResponse>
{
  constructor(
    @Inject(PlaylistRepositoryType)
    private readonly playlistRepository: PlaylistRepository,
    @Inject(S3ServiceInterfaceType)
    private readonly s3Service: S3ServiceInterface,
  ) {}

  public async execute({
    params,
    userId,
    cover,
  }: CreatePlaylistArguments): Promise<CreatePlaylistResponse> {
    let playlist: Playlist = null;
    try {
      let coverUrl = mockData.cover;

      if (cover) {
        const formattedCoverFileName = this.s3Service.formatFileName(
          cover.originalname,
          FileObjectName.cover,
        );

        coverUrl = await this.s3Service.uploadFile(
          cover,
          formattedCoverFileName,
          [FileObjectName.cover],
          true,
        );
      }

      playlist = await this.playlistRepository.create({
        title: params.title,
        description: params.description,
        cover_url: coverUrl,
        user_id: userId,
        is_private: params.is_private,
      });
    } catch (err) {
      throw new Error('Error creating song');
    }

    return {
      id: playlist.id,
      title: playlist.title,
      description: playlist.description,
      cover_url: playlist.cover_url,
      user_id: playlist.user_id,
      songs_count: 0,
      is_private: playlist.is_private,
      created_at: playlist.created_at,
      deleted_at: playlist.deleted_at,
    };
  }
}
