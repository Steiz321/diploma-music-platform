import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import { StatusResponse } from 'src/core/shared-kernel/rest/dto/status-response.dto';
import { LikeToSongRepositoryType } from '../../ports/like-to-song.repository';
import { LikeToSongRepository } from '../../ports/like-to-song.repository';
import { QueryBus } from '@nestjs/cqrs';
import { GetSongByIdQuery } from 'src/core/components/song/application/query-handler/get-song-by-id/get-song-by-id.query';

interface CreateSongLikeArgument {
  songId: number;
  userId: number;
}

@Injectable()
export default class CreateSongLikeUseCase
  implements UseCase<CreateSongLikeArgument, StatusResponse>
{
  constructor(
    @Inject(LikeToSongRepositoryType)
    private readonly likeToSongRepository: LikeToSongRepository,
    private readonly queryBus: QueryBus,
  ) {}

  public async execute({
    songId,
    userId,
  }: CreateSongLikeArgument): Promise<StatusResponse> {
    const song = await this.queryBus.execute(new GetSongByIdQuery(songId));

    if (!song) {
      throw new NotFoundException('Song not found');
    }

    const like = await this.likeToSongRepository.getOneWhere({
      song_id: songId,
      user_id: userId,
    });

    if (like) {
      await this.likeToSongRepository.delete(like.id);
    } else {
      await this.likeToSongRepository.create({
        song_id: songId,
        user_id: userId,
      });
    }

    return StatusResponse.ok();
  }
}
