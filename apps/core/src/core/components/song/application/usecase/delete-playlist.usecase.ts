import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import { StatusResponse } from 'src/core/shared-kernel/rest/dto/status-response.dto';
import { Sequelize } from 'sequelize-typescript';
import { CommandBus } from '@nestjs/cqrs';
import {
  PlaylistRepository,
  PlaylistRepositoryType,
} from '../../ports/playlist.repository';
import { DeletePlaylistLikesCommand } from 'src/core/components/like/application/command-handler/delete-playlist-likes/delete-playlist-likes.command';
import {
  SongToPlaylistRepository,
  SongToPlaylistRepositoryType,
} from '../../ports/song-to-playlist.repository';

interface DeletePlaylistArguments {
  playlistId: number;
  userId: number;
}

@Injectable()
export default class DeletePlaylistUseCase
  implements UseCase<DeletePlaylistArguments, StatusResponse>
{
  constructor(
    private readonly sequelize: Sequelize,
    private readonly commandBus: CommandBus,
    @Inject(PlaylistRepositoryType)
    private readonly playlistRepository: PlaylistRepository,
    @Inject(SongToPlaylistRepositoryType)
    private readonly songToPlaylistRepository: SongToPlaylistRepository,
  ) {}

  public async execute({
    playlistId,
    userId,
  }: DeletePlaylistArguments): Promise<StatusResponse> {
    const playlist = await this.playlistRepository.getOneWhere({
      id: playlistId,
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.user_id !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this playlist',
      );
    }

    const t = await this.sequelize.transaction();

    try {
      await this.commandBus.execute(
        new DeletePlaylistLikesCommand(playlistId, t),
      );

      const songsInPlaylist = await this.songToPlaylistRepository.getAllWhere({
        playlist_id: playlistId,
      });

      if (songsInPlaylist.length > 0) {
        for (const songInPlaylist of songsInPlaylist) {
          await this.songToPlaylistRepository.delete(songInPlaylist.id, t);
        }
      }

      await this.playlistRepository.smartDelete(playlistId, t);

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw new Error('Error deleting song');
    }

    return StatusResponse.ok();
  }
}
