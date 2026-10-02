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
import { QueryBus } from '@nestjs/cqrs';
import { GetPlaylistByIdQuery } from 'src/core/components/song/application/query-handler/get-playlist-by-id/get-playlist-by-id.query';
import {
  LikeToPlaylistRepository,
  LikeToPlaylistRepositoryType,
} from '../../ports/like-to-playlist.repository';

interface CreatePlaylistLikeArgument {
  playlistId: number;
  userId: number;
}

@Injectable()
export default class CreatePlaylistLikeUseCase
  implements UseCase<CreatePlaylistLikeArgument, StatusResponse>
{
  constructor(
    @Inject(LikeToPlaylistRepositoryType)
    private readonly likeToPlaylistRepository: LikeToPlaylistRepository,
    private readonly queryBus: QueryBus,
    private readonly sequelize: Sequelize,
  ) {}

  public async execute({
    playlistId,
    userId,
  }: CreatePlaylistLikeArgument): Promise<StatusResponse> {
    const playlist = await this.queryBus.execute(
      new GetPlaylistByIdQuery(playlistId),
    );

    if (!playlist) {
      throw new NotFoundException('Song not found');
    }

    // one row per user–playlist pair: unlike sets deleted_at, a repeated like
    // clears it; the row is locked so concurrent toggles do not interleave
    try {
      await this.sequelize.transaction(async (t) => {
        const like = await this.likeToPlaylistRepository.getOneForUpdate(
          { playlist_id: playlistId, user_id: userId },
          t,
        );

        if (!like) {
          await this.likeToPlaylistRepository.create(
            { playlist_id: playlistId, user_id: userId },
            t,
          );
        } else {
          await this.likeToPlaylistRepository.update(
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
