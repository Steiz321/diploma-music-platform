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
    await this.likeToSongRepository.softDeleteWhere(
      { song_id: songId },
      transaction,
    );

    return StatusResponse.ok();
  }
}
