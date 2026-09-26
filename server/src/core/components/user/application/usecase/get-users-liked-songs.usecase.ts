import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import {
  UserRepository,
  UserRepositoryType,
} from '../../ports/user.repository';
import { GetLikedSongsResponse } from '../data/response/get-liked-songs.response';
import { CheckSongLikeQuery } from 'src/core/components/like/application/query-handler/check-song-like/check-song-like.query';
import { QueryBus } from '@nestjs/cqrs';

interface GetUsersLikedSongsArguments {
  userId: number;
}

@Injectable()
export default class GetUsersLikedSongsUseCase
  implements UseCase<GetUsersLikedSongsArguments, GetLikedSongsResponse>
{
  constructor(
    @Inject(UserRepositoryType)
    private readonly userRepository: UserRepository,
    private readonly queryBus: QueryBus,
  ) {}

  public async execute({
    userId,
  }: GetUsersLikedSongsArguments): Promise<GetLikedSongsResponse> {
    const user = await this.userRepository.getOneWithLikedSongs(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resultSongsArray = await Promise.all(
      user.liked_songs.map(async (song) => {
        const isSongLiked = await this.queryBus.execute(
          new CheckSongLikeQuery(song.user_id, song.id),
        );
        return {
          ...song,
          is_liked: isSongLiked,
        };
      }),
    );

    return {
      liked_songs:
        resultSongsArray.map((song) => ({
          id: song.id,
          name: song.name,
          cover_url: song.cover_url,
          user_id: song.user_id,
          audio: song.audio,
          is_liked: song.is_liked,
          description: song.description,
          text: song.text,
          listens: song.listens,
          created_at: song.created_at,
          deleted_at: song.deleted_at,
          user: {
            id: song.user.id,
            username: song.user.username,
            avatar: song.user.avatar,
          },
        })) || [],
    };
  }
}
