import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import {
  SongRepository,
  SongRepositoryType,
} from '../../ports/song.repository';
import { GetAllSongsResponse } from '../data/response/get-all-songs.response';
import { QueryBus } from '@nestjs/cqrs';
import { CheckSongLikeQuery } from 'src/core/components/like/application/query-handler/check-song-like/check-song-like.query';

interface GetAllSongsArguments {
  search: string;
  userId: number;
}

@Injectable()
export default class GetAllSongsUseCase
  implements UseCase<GetAllSongsArguments, GetAllSongsResponse>
{
  constructor(
    @Inject(SongRepositoryType)
    private readonly songRepository: SongRepository,
    private readonly queryBus: QueryBus,
  ) {}

  public async execute({
    search,
    userId,
  }: GetAllSongsArguments): Promise<GetAllSongsResponse> {
    const songs = await this.songRepository.getAll(search);

    const resultArray = await Promise.all(
      songs.map(async (song) => {
        const isSongLiked = await this.queryBus.execute(
          new CheckSongLikeQuery(userId, song.id),
        );
        return {
          ...song,
          is_liked: isSongLiked,
        };
      }),
    );

    return {
      songs: resultArray.map((song) => ({
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
        user: song.user,
      })),
    };
  }
}
