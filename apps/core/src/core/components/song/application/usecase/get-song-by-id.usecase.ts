import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import {
  SongRepository,
  SongRepositoryType,
} from '../../ports/song.repository';
import { GetSongByIdResponse } from '../data/response/get-song-by-id.response';
import { QueryBus } from '@nestjs/cqrs';
import { CheckSongLikeQuery } from 'src/core/components/like/application/query-handler/check-song-like/check-song-like.query';

interface GetSongByIdArguments {
  id: number;
  userId: number;
}

@Injectable()
export default class GetSongByIdUseCase
  implements UseCase<GetSongByIdArguments, GetSongByIdResponse>
{
  constructor(
    @Inject(SongRepositoryType)
    private readonly songRepository: SongRepository,
    private readonly queryBus: QueryBus,
  ) {}

  public async execute({
    id,
    userId,
  }: GetSongByIdArguments): Promise<GetSongByIdResponse> {
    const song = await this.songRepository.getOneWhere({ id });

    if (!song) {
      throw new NotFoundException('Song not found');
    }

    const isSongLiked = await this.queryBus.execute(
      new CheckSongLikeQuery(userId, song.id),
    );

    return {
      id: song.id,
      name: song.name,
      cover_url: song.cover_url,
      user_id: song.user_id,
      audio: song.audio,
      description: song.description,
      text: song.text,
      is_liked: isSongLiked,
      listens: song.listens,
      transcription_status: song.transcription_status,
      language: song.language,
      created_at: song.created_at,
      deleted_at: song.deleted_at,
      user: {
        id: song.user.id,
        username: song.user.username,
        avatar: song.user.avatar,
      },
    };
  }
}
