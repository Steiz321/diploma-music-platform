import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import { UserRepository } from '../../ports/user.repository';
import { UserRepositoryType } from '../../ports/user.repository';
import { GetUserByIdResponse } from '../data/response/get-user-by-id.response';
import { QueryBus } from '@nestjs/cqrs';
import { CheckSongLikeQuery } from 'src/core/components/like/application/query-handler/check-song-like/check-song-like.query';

interface GetUserByIdArguments {
  userId: number;
  myUserId: number;
}

@Injectable()
export default class GetUserByIdUseCase
  implements UseCase<GetUserByIdArguments, GetUserByIdResponse>
{
  constructor(
    @Inject(UserRepositoryType)
    private readonly userRepository: UserRepository,
    private readonly queryBus: QueryBus,
  ) {}

  public async execute({
    userId,
    myUserId,
  }: GetUserByIdArguments): Promise<GetUserByIdResponse> {
    const user = await this.userRepository.getOneWithOwnSongs(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resultSongsArray = await Promise.all(
      user.songs.map(async (song) => {
        const isSongLiked = await this.queryBus.execute(
          new CheckSongLikeQuery(myUserId, song.id),
        );
        return {
          ...song,
          is_liked: isSongLiked,
        };
      }),
    );

    return {
      id: user.id,
      username: user.username,
      description: user.description,
      avatar: user.avatar,
      type: user.type,
      is_verified: user.is_verified,
      created_at: user.created_at,
      songs: resultSongsArray.map((song) => ({
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
      })),
    };
  }
}
