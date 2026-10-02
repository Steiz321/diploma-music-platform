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
    await this.likeToPlaylistRepository.softDeleteWhere(
      { playlist_id: playlistId },
      transaction,
    );

    return StatusResponse.ok();
  }
}
