import { Injectable, Inject, Logger } from '@nestjs/common';
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
import { TranscriptionStatus } from 'src/core/shared-kernel/data/enum/transcription-status.enum';

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
  private readonly logger = new Logger(CreateSongUseCase.name);

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
    let audioKey: string;
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
      audioKey = uploadedAudio.key;

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

      // saved first with transcription_status = pending
      song = await this.songRepository.create({
        name: params.name,
        cover_url: coverUrl,
        user_id: userId,
        audio: uploadedAudio.url,
        description: null,
        text: null,
      });
    } catch (err) {
      this.logger.error(`Error creating song: ${err.message}`, err.stack);
      throw new Error('Error creating song');
    }

    song = await this.transcribe(song, audioKey);

    return {
      id: song.id,
      name: song.name,
      cover_url: song.cover_url,
      user_id: song.user_id,
      audio: song.audio,
      description: song.description,
      text: song.text,
      listens: song.listens,
      transcription_status: song.transcription_status,
      language: song.language,
      created_at: song.created_at,
      deleted_at: song.deleted_at,
    };
  }

  // Transcription failures never fail the upload: the song keeps
  // transcription_status = failed and the reason is logged.
  private async transcribe(song: Song, audioKey: string): Promise<Song> {
    try {
      const transcription =
        await this.transcriptionService.transcribe(audioKey);
      const text = buildLyrics(transcription.segments);

      return await this.songRepository.update(
        {
          transcription,
          transcription_status: text
            ? TranscriptionStatus.done
            : TranscriptionStatus.no_lyrics,
          language: transcription.language,
          text: text || null,
        },
        { id: song.id },
      );
    } catch (err) {
      this.logger.error(
        `Transcription failed for song ${song.id} (${audioKey}): ${err.message}`,
        err.stack,
      );

      try {
        return await this.songRepository.update(
          { transcription_status: TranscriptionStatus.failed },
          { id: song.id },
        );
      } catch (updateErr) {
        this.logger.error(
          `Could not mark song ${song.id} as failed: ${updateErr.message}`,
          updateErr.stack,
        );
        return song;
      }
    }
  }
}
