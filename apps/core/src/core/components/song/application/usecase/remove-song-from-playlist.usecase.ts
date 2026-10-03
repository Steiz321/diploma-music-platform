import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import {
  PlaylistRepository,
  PlaylistRepositoryType,
} from '../../ports/playlist.repository';
import {
  SongToPlaylistRepository,
  SongToPlaylistRepositoryType,
} from '../../ports/song-to-playlist.repository';
import { StatusResponse } from 'src/core/shared-kernel/rest/dto/status-response.dto';

interface RemoveSongFromPlaylistArguments {
  songId: number;
  playlistId: number;
  userId: number;
}

@Injectable()
export default class RemoveSongFromPlaylistUseCase
  implements UseCase<RemoveSongFromPlaylistArguments, StatusResponse>
{
  constructor(
    @Inject(PlaylistRepositoryType)
    private readonly playlistRepository: PlaylistRepository,
    @Inject(SongToPlaylistRepositoryType)
    private readonly songToPlaylistRepository: SongToPlaylistRepository,
  ) {}

  public async execute({
    songId,
    playlistId,
    userId,
  }: RemoveSongFromPlaylistArguments): Promise<StatusResponse> {
    const playlist = await this.playlistRepository.getOneWhere({
      id: playlistId,
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.user_id !== userId) {
      throw new ForbiddenException(
        'You are not allowed to remove songs from this playlist',
      );
    }

    const songToPlaylist = await this.songToPlaylistRepository.getOneWhere({
      song_id: songId,
      playlist_id: playlistId,
    });

    if (!songToPlaylist) {
      throw new NotFoundException('Song is not in the playlist');
    }

    await this.songToPlaylistRepository.delete(songToPlaylist.id);

    return StatusResponse.ok();
  }
}
