import { Injectable, Inject, NotFoundException } from '@nestjs/common';
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

    const like = await this.likeToPlaylistRepository.getOneWhere({
      playlist_id: playlistId,
      user_id: userId,
    });

    if (like) {
      await this.likeToPlaylistRepository.delete(like.id);
    } else {
      await this.likeToPlaylistRepository.create({
        playlist_id: playlistId,
        user_id: userId,
      });
    }

    return StatusResponse.ok();
  }
}
