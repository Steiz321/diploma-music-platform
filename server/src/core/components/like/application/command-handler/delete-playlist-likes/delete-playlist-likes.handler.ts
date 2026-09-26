import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { StatusResponse } from 'src/core/shared-kernel/rest/dto/status-response.dto';
import { DeletePlaylistLikesCommand } from './delete-playlist-likes.command';
import {
  LikeToPlaylistRepository,
  LikeToPlaylistRepositoryType,
} from '../../../ports/like-to-playlist.repository';

@CommandHandler(DeletePlaylistLikesCommand)
export class DeletePlaylistLikesCommandHandler
  implements ICommandHandler<DeletePlaylistLikesCommand, StatusResponse>
{
  constructor(
    @Inject(LikeToPlaylistRepositoryType)
    private readonly likeToPlaylistRepository: LikeToPlaylistRepository,
  ) {}

  public async execute({
    playlistId,
    transaction,
  }: DeletePlaylistLikesCommand): Promise<StatusResponse> {
    const likes = await this.likeToPlaylistRepository.getAllWhere({
      playlist_id: playlistId,
    });

    if (likes.length === 0) {
      return StatusResponse.ok();
    }

    for (const like of likes) {
      await this.likeToPlaylistRepository.delete(like.id, transaction);
    }

    return StatusResponse.ok();
  }
}
