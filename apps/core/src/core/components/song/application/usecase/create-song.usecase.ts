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
import { EVENT_TYPES } from '@platform/contracts';
import { Sequelize } from 'sequelize-typescript';
import { OutboxPort, OutboxPortType } from '@platform/messaging';
import { newEvent } from 'src/core/shared-kernel/events/new-event';

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
    @Inject(OutboxPortType)
    private readonly outbox: OutboxPort,
    private readonly sequelize: Sequelize,
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

      // saved with transcription_status = pending; the song and its
      // song.uploaded event are committed together. The AI enrichment
      // service transcribes and analyses it asynchronously (song.enriched).
      song = await this.sequelize.transaction(async (t) => {
        const created = await this.songRepository.create(
          {
            name: params.name,
            cover_url: coverUrl,
            user_id: userId,
            audio: uploadedAudio.url,
            description: null,
            text: null,
          },
          t,
        );

        await this.outbox.add(
          newEvent(
            EVENT_TYPES.songUploaded,
            {
              song_id: created.id,
              author_id: userId,
              audio_key: audioKey,
              title: created.name,
            },
            userId,
          ),
          { transaction: t, aggregateType: 'song', aggregateId: created.id },
        );

        return created;
      });
    } catch (err) {
      this.logger.error(`Error creating song: ${err.message}`, err.stack);
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
      transcription_status: song.transcription_status,
      language: song.language,
      created_at: song.created_at,
      deleted_at: song.deleted_at,
    };
  }
}
