import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import {
  UserRepository,
  UserRepositoryType,
} from '../../ports/user.repository';
import { QueryBus } from '@nestjs/cqrs';
import { CheckPlaylistLikeQuery } from 'src/core/components/like/application/query-handler/check-playlist-like/check-playlist-like.query';
import { GetLikedPlaylistsResponse } from '../data/response/get-liked-playlists.response';

interface GetUsersLikedPlaylistsArguments {
  userId: number;
}

@Injectable()
export default class GetUsersLikedPlaylistsUseCase
  implements UseCase<GetUsersLikedPlaylistsArguments, GetLikedPlaylistsResponse>
{
  constructor(
    @Inject(UserRepositoryType)
    private readonly userRepository: UserRepository,
    private readonly queryBus: QueryBus,
  ) {}

  public async execute({
    userId,
  }: GetUsersLikedPlaylistsArguments): Promise<GetLikedPlaylistsResponse> {
    const user = await this.userRepository.getOneWithLikedPlaylists(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resultPlaylistsArray = await Promise.all(
      user.liked_playlists.map(async (playlist) => {
        const isPlaylistLiked = await this.queryBus.execute(
          new CheckPlaylistLikeQuery(user.id, playlist.id),
        );
        return {
          ...playlist,
          is_liked: isPlaylistLiked,
        };
      }),
    );

    return {
      liked_playlists:
        resultPlaylistsArray.map((playlist) => ({
          id: playlist.id,
          title: playlist.title,
          cover_url: playlist.cover_url,
          user_id: playlist.user_id,
          is_liked: playlist.is_liked,
          description: playlist.description,
          created_at: playlist.created_at,
          deleted_at: playlist.deleted_at,
          user: {
            id: playlist.user.id,
            username: playlist.user.username,
            avatar: playlist.user.avatar,
          },
        })) || [],
    };
  }
}
