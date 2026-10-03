import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CheckSongLikeQuery } from './check-song-like.query';
import {
  LikeToSongRepository,
  LikeToSongRepositoryType,
} from '../../../ports/like-to-song.repository';

@QueryHandler(CheckSongLikeQuery)
export class CheckSongLikeQueryHandler
  implements IQueryHandler<CheckSongLikeQuery>
{
  constructor(
    @Inject(LikeToSongRepositoryType)
    private readonly likeToSongRepository: LikeToSongRepository,
  ) {}

  async execute(query: CheckSongLikeQuery): Promise<boolean> {
    const like = await this.likeToSongRepository.getOneWhere({
      user_id: query.userId,
      song_id: query.songId,
    });
    return !!like;
  }
}
