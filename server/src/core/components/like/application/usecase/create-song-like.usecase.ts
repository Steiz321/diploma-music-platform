import {
  ConflictException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { UniqueConstraintError } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
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
    private readonly sequelize: Sequelize,
  ) {}

  public async execute({
    songId,
    userId,
  }: CreateSongLikeArgument): Promise<StatusResponse> {
    const song = await this.queryBus.execute(new GetSongByIdQuery(songId));

    if (!song) {
      throw new NotFoundException('Song not found');
    }

    // one row per user–song pair: unlike sets deleted_at, a repeated like
    // clears it; the row is locked so concurrent toggles do not interleave
    try {
      await this.sequelize.transaction(async (t) => {
        const like = await this.likeToSongRepository.getOneForUpdate(
          { song_id: songId, user_id: userId },
          t,
        );

        if (!like) {
          await this.likeToSongRepository.create(
            { song_id: songId, user_id: userId },
            t,
          );
        } else {
          await this.likeToSongRepository.update(
            { deleted_at: like.deleted_at ? null : new Date() },
            { id: like.id },
            t,
          );
        }
      });
    } catch (err) {
      // the first like of the pair raced with another request
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException('Like is already being processed');
      }
      throw err;
    }

    return StatusResponse.ok();
  }
}
