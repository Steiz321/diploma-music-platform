import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  SongRepository,
  SongRepositoryType,
} from '../../../ports/song.repository';
import { Song } from '../../data/song.dto';
import { GetSongByIdQuery } from './get-song-by-id.query';

@QueryHandler(GetSongByIdQuery)
export class GetSongByIdHandler implements IQueryHandler<GetSongByIdQuery> {
  constructor(
    @Inject(SongRepositoryType)
    private readonly songRepository: SongRepository,
  ) {}

  async execute(query: GetSongByIdQuery): Promise<Song> {
    const song = await this.songRepository.getOneWhere({
      id: query.songId,
      deleted_at: null,
    });
    return song;
  }
}
