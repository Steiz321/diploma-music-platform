import {
  ConflictException,
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
  SongRepository,
  SongRepositoryType,
} from '../../ports/song.repository';
import {
  SongToPlaylistRepository,
  SongToPlaylistRepositoryType,
} from '../../ports/song-to-playlist.repository';
import { StatusResponse } from 'src/core/shared-kernel/rest/dto/status-response.dto';
import { Sequelize } from 'sequelize-typescript';
import { EVENT_TYPES } from '@platform/contracts';
import { OutboxPort, OutboxPortType } from '@platform/messaging';
import { newEvent } from 'src/core/shared-kernel/events/new-event';

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
    @Inject(OutboxPortType)
    private readonly outbox: OutboxPort,
    private readonly sequelize: Sequelize,
  ) {}

  public async execute({
    songId,
    playlistId,
    userId,
  }: AddSongToPlaylistArguments): Promise<StatusResponse> {
    const song = await this.songRepository.getOneWhere({ id: songId });

    if (!song) {
      throw new NotFoundException('Song not found');
    }

    const playlist = await this.playlistRepository.getOneWhere({
      id: playlistId,
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.user_id !== userId) {
      throw new ForbiddenException(
        'You are not allowed to add songs to this playlist',
      );
    }

    const songToPlaylist = await this.songToPlaylistRepository.getOneWhere({
      song_id: song.id,
      playlist_id: playlist.id,
    });

    if (songToPlaylist) {
      throw new ConflictException('Song already in playlist');
    }

    await this.sequelize.transaction(async (t) => {
      await this.songToPlaylistRepository.create(
        { song_id: song.id, playlist_id: playlist.id },
        t,
      );

      await this.outbox.add(
        newEvent(
          EVENT_TYPES.playlistSongAdded,
          { playlist_id: playlist.id, song_id: song.id, user_id: userId },
          userId,
        ),
        {
          transaction: t,
          aggregateType: 'playlist',
          aggregateId: playlist.id,
        },
      );
    });

    return StatusResponse.ok();
  }
}
