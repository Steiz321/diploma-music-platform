import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CheckPlaylistLikeQuery } from './check-playlist-like.query';
import {
  LikeToPlaylistRepository,
  LikeToPlaylistRepositoryType,
} from '../../../ports/like-to-playlist.repository';

@QueryHandler(CheckPlaylistLikeQuery)
export class CheckPlaylistLikeQueryHandler
  implements IQueryHandler<CheckPlaylistLikeQuery>
{
  constructor(
    @Inject(LikeToPlaylistRepositoryType)
    private readonly likeToPlaylistRepository: LikeToPlaylistRepository,
  ) {}

  async execute(query: CheckPlaylistLikeQuery): Promise<boolean> {
    const like = await this.likeToPlaylistRepository.getOneWhere({
      user_id: query.userId,
      playlist_id: query.playlistId,
    });
    return !!like;
  }
}
