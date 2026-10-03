import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import {
  PlaylistRepository,
  PlaylistRepositoryType,
} from '../../ports/playlist.repository';
import { QueryBus } from '@nestjs/cqrs';
import { CheckSongLikeQuery } from 'src/core/components/like/application/query-handler/check-song-like/check-song-like.query';
import { GetAllPlaylistsResponse } from '../data/response/get-all-playlists.response';
import { CheckPlaylistLikeQuery } from 'src/core/components/like/application/query-handler/check-playlist-like/check-playlist-like.query';

interface GetAllPlaylistsArguments {
  userId: number;
}

@Injectable()
export default class GetAllPlaylistsUseCase
  implements UseCase<GetAllPlaylistsArguments, GetAllPlaylistsResponse>
{
  constructor(
    @Inject(PlaylistRepositoryType)
    private readonly playlistRepository: PlaylistRepository,
    private readonly queryBus: QueryBus,
  ) {}

  public async execute({
    userId,
  }: GetAllPlaylistsArguments): Promise<GetAllPlaylistsResponse> {
    const playlists = await this.playlistRepository.getAll({});

    const resultPlaylists = await Promise.all(
      playlists.map(async (playlist) => {
        const isLiked = await this.queryBus.execute(
          new CheckPlaylistLikeQuery(userId, playlist.id),
        );

        return {
          ...playlist,
          is_liked: isLiked,
        };
      }),
    );

    return {
      playlists: resultPlaylists.map((playlist) => ({
        id: playlist.id,
        title: playlist.title,
        description: playlist.description,
        cover_url: playlist.cover_url,
        user_id: playlist.user_id,
        is_private: playlist.is_private,
        is_liked: playlist.is_liked,
        songs_count: playlist.songs.length || 0,
        created_at: playlist.created_at,
        deleted_at: playlist.deleted_at,
        user: {
          id: playlist.user.id,
          username: playlist.user.username,
          avatar: playlist.user.avatar,
        },
      })),
    };
  }
}
