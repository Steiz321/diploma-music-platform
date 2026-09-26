import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import { CreateSongRequest } from '../data/request/create-song.request';
import { CreateSongResponse } from '../data/response/create-song.response';
import {
  SongRepository,
  SongRepositoryType,
} from '../../ports/song.repository';
import { FileObjectName } from 'src/core/shared-kernel/secondary-adapters/s3/data/enum/file-object-name.enum';
import {
  S3ServiceInterface,
  S3ServiceInterfaceType,
} from 'src/core/shared-kernel/ports/s3-service.interface';
import { Song } from '../data/song.dto';
import { mockData } from 'src/core/shared-kernel/data/constants/mock-data.constant';
import {
  TranscriptionServiceInterface,
  TranscriptionServiceInterfaceType,
} from 'src/core/shared-kernel/ports/transcription-service.interface';
import { buildLyrics } from 'src/core/shared-kernel/common/build-lyrics.util';

interface CreateSongArguments {
  audio: Express.Multer.File;
  params: CreateSongRequest;
  userId: number;
  cover?: Express.Multer.File;
}

@Injectable()
export default class CreateSongUseCase
  implements UseCase<CreateSongArguments, CreateSongResponse>
{
  constructor(
    @Inject(SongRepositoryType)
    private readonly songRepository: SongRepository,
    @Inject(S3ServiceInterfaceType)
    private readonly s3Service: S3ServiceInterface,
    @Inject(TranscriptionServiceInterfaceType)
    private readonly transcriptionService: TranscriptionServiceInterface,
  ) {}

  public async execute({
    audio,
    cover,
    params,
    userId,
  }: CreateSongArguments): Promise<CreateSongResponse> {
    let song: Song = null;
    try {
      const formattedAudioName = this.s3Service.formatFileName(
        audio.originalname,
        FileObjectName.song,
      );

      const uploadedAudio = await this.s3Service.uploadFile(
        audio,
        formattedAudioName,
        [FileObjectName.song],
      );

      let coverUrl = mockData.cover;

      if (cover) {
        const formattedCoverFileName = this.s3Service.formatFileName(
          cover.originalname,
          FileObjectName.cover,
        );

        coverUrl = (
          await this.s3Service.uploadFile(cover, formattedCoverFileName, [
            FileObjectName.cover,
          ])
        ).url;
      }

      const transcription = await this.transcriptionService.transcribe(
        uploadedAudio.key,
      );
      const text = buildLyrics(transcription.segments);

      song = await this.songRepository.create({
        name: params.name,
        cover_url: coverUrl,
        user_id: userId,
        audio: uploadedAudio.url,
        description: null,
        text: text || null,
      });
    } catch (err) {
      throw new Error('Error creating song');
    }

    return {
      id: song.id,
      name: song.name,
      cover_url: song.cover_url,
      user_id: song.user_id,
      audio: song.audio,
      description: song.description,
      text: song.text,
      listens: song.listens,
      created_at: song.created_at,
      deleted_at: song.deleted_at,
    };
  }
}
