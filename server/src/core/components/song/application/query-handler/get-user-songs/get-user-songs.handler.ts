import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserSongsQuery } from './get-user-songs.query';
import {
  SongRepository,
  SongRepositoryType,
} from '../../../ports/song.repository';
import { Song } from '../../data/song.dto';

@QueryHandler(GetUserSongsQuery)
export class GetUserSongsHandler implements IQueryHandler<GetUserSongsQuery> {
  constructor(
    @Inject(SongRepositoryType)
    private readonly songRepository: SongRepository,
  ) {}

  async execute(query: GetUserSongsQuery): Promise<Song[]> {
    const songs = await this.songRepository.getManyWhere({
      user_id: query.userId,
      deleted_at: null,
    });
    return songs;
  }
}
