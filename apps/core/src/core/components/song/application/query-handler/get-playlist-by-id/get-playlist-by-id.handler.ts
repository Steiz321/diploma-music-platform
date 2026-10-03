import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetPlaylistByIdQuery } from './get-playlist-by-id.query';
import {
  PlaylistRepository,
  PlaylistRepositoryType,
} from '../../../ports/playlist.repository';
import { Playlist } from '../../data/playlist.dto';

@QueryHandler(GetPlaylistByIdQuery)
export class GetPlaylistByIdQueryHandler
  implements IQueryHandler<GetPlaylistByIdQuery>
{
  constructor(
    @Inject(PlaylistRepositoryType)
    private readonly playlistRepository: PlaylistRepository,
  ) {}

  async execute(query: GetPlaylistByIdQuery): Promise<Playlist> {
    const playlist = await this.playlistRepository.getOneWhere({
      id: query.playlistId,
      deleted_at: null,
    });
    return playlist;
  }
}
