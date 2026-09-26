import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import {
  PlaylistRepository,
  PlaylistRepositoryType,
} from '../../ports/playlist.repository';

import { QueryBus } from '@nestjs/cqrs';
import { CheckSongLikeQuery } from 'src/core/components/like/application/query-handler/check-song-like/check-song-like.query';
import { GetPlaylistByIdResponse } from '../data/response/get-playlist-by-id.response';
import { CheckPlaylistLikeQuery } from 'src/core/components/like/application/query-handler/check-playlist-like/check-playlist-like.query';

interface GetPlaylistByIdArguments {
  playlistId: number;
  userId: number;
}

@Injectable()
export default class GetPlaylistByIdUseCase
  implements UseCase<GetPlaylistByIdArguments, GetPlaylistByIdResponse>
{
  constructor(
    @Inject(PlaylistRepositoryType)
    private readonly playlistRepository: PlaylistRepository,
    private readonly queryBus: QueryBus,
  ) {}

  public async execute({
    playlistId,
    userId,
  }: GetPlaylistByIdArguments): Promise<GetPlaylistByIdResponse> {
    const playlist = await this.playlistRepository.getOneWithRelations({
      id: playlistId,
    });

    if (!playlist || (playlist.is_private && playlist.user_id !== userId)) {
      throw new Error('Playlist not found');
    }

    const isLiked = await this.queryBus.execute(
      new CheckPlaylistLikeQuery(userId, playlist.id),
    );

    const resultSongs = await Promise.all(
      playlist.songs.map(async (song) => {
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
      id: playlist.id,
      title: playlist.title,
      description: playlist.description,
      cover_url: playlist.cover_url,
      user_id: playlist.user_id,
      songs_count: playlist.songs.length || 0,
      is_private: playlist.is_private,
      is_liked: isLiked,
      created_at: playlist.created_at,
      songs: resultSongs.map((song) => ({
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
      user: {
        id: playlist.user.id,
        username: playlist.user.username,
        avatar: playlist.user.avatar,
      },
    };
  }
}
