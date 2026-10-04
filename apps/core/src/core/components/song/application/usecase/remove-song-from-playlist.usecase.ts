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
import { Sequelize } from 'sequelize-typescript';
import { EVENT_TYPES } from '@platform/contracts';
import { OutboxPort, OutboxPortType } from '@platform/messaging';
import { newEvent } from 'src/core/shared-kernel/events/new-event';

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
    @Inject(OutboxPortType)
    private readonly outbox: OutboxPort,
    private readonly sequelize: Sequelize,
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

    await this.sequelize.transaction(async (t) => {
      await this.songToPlaylistRepository.delete(songToPlaylist.id, t);

      await this.outbox.add(
        newEvent(
          EVENT_TYPES.playlistSongRemoved,
          { playlist_id: playlistId, song_id: songId, user_id: userId },
          userId,
        ),
        {
          transaction: t,
          aggregateType: 'playlist',
          aggregateId: playlistId,
        },
      );
    });

    return StatusResponse.ok();
  }
}
