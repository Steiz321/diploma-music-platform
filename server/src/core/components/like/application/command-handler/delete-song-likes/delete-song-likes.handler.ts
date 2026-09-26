import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteSongLikesCommand } from './delete-song-likes.command';
import {
  LikeToSongRepository,
  LikeToSongRepositoryType,
} from '../../../ports/like-to-song.repository';
import { StatusResponse } from 'src/core/shared-kernel/rest/dto/status-response.dto';

@CommandHandler(DeleteSongLikesCommand)
export class DeleteSongLikesCommandHandler
  implements ICommandHandler<DeleteSongLikesCommand, StatusResponse>
{
  constructor(
    @Inject(LikeToSongRepositoryType)
    private readonly likeToSongRepository: LikeToSongRepository,
  ) {}

  public async execute({
    songId,
    transaction,
  }: DeleteSongLikesCommand): Promise<StatusResponse> {
    const likes = await this.likeToSongRepository.getAllWhere({
      song_id: songId,
    });

    if (likes.length === 0) {
      return StatusResponse.ok();
    }

    for (const like of likes) {
      await this.likeToSongRepository.delete(like.id, transaction);
    }

    return StatusResponse.ok();
  }
}
