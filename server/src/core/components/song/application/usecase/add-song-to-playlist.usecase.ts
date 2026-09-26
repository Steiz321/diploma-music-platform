import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import {
  PlaylistRepository,
  PlaylistRepositoryType,
} from '../../ports/playlist.repository';
import {
  SongRepository,
  SongRepositoryType,
} from '../../ports/song.repository';
import {
  SongToPlaylistRepository,
  SongToPlaylistRepositoryType,
} from '../../ports/song-to-playlist.repository';
import { StatusResponse } from 'src/core/shared-kernel/rest/dto/status-response.dto';

interface AddSongToPlaylistArguments {
  songId: number;
  playlistId: number;
  userId: number;
}

@Injectable()
export default class AddSongToPlaylistUseCase
  implements UseCase<AddSongToPlaylistArguments, StatusResponse>
{
  constructor(
    @Inject(PlaylistRepositoryType)
    private readonly playlistRepository: PlaylistRepository,
    @Inject(SongRepositoryType)
    private readonly songRepository: SongRepository,
    @Inject(SongToPlaylistRepositoryType)
    private readonly songToPlaylistRepository: SongToPlaylistRepository,
  ) {}

  public async execute({
    songId,
    playlistId,
    userId,
  }: AddSongToPlaylistArguments): Promise<StatusResponse> {
    const song = await this.songRepository.getOneWhere({ id: songId });

    if (!song) {
      throw new Error('Song not found');
    }

    const playlist = await this.playlistRepository.getOneWhere({
      id: playlistId,
    });

    if (!playlist) {
      throw new Error('Playlist not found');
    }

    if (playlist.user_id !== userId) {
      throw new Error('Playlist not found');
    }

    const songToPlaylist = await this.songToPlaylistRepository.getOneWhere({
      song_id: song.id,
      playlist_id: playlist.id,
    });

    if (songToPlaylist) {
      throw new Error('Song already in playlist');
    }

    await this.songToPlaylistRepository.create({
      song_id: song.id,
      playlist_id: playlist.id,
    });

    return StatusResponse.ok();
  }
}
