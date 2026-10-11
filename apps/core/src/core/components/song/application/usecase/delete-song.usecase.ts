import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import {
  SongRepository,
  SongRepositoryType,
} from '../../ports/song.repository';
import { StatusResponse } from 'src/core/shared-kernel/rest/dto/status-response.dto';
import {
  SongToPlaylistRepository,
  SongToPlaylistRepositoryType,
} from '../../ports/song-to-playlist.repository';
import { Sequelize } from 'sequelize-typescript';
import {
  ListensRepository,
  ListensRepositoryType,
} from '../../ports/listens.repository';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteSongLikesCommand } from 'src/core/components/like/application/command-handler/delete-song-likes/delete-song-likes.command';
import { EVENT_TYPES } from '@platform/contracts';
import { OutboxPort, OutboxPortType } from '@platform/messaging';
import { newEvent } from 'src/core/shared-kernel/events/new-event';

interface DeleteSongArguments {
  songId: number;
  userId: number;
}

@Injectable()
export default class DeleteSongUseCase
  implements UseCase<DeleteSongArguments, StatusResponse>
{
  constructor(
    private readonly sequelize: Sequelize,
    private readonly commandBus: CommandBus,
    @Inject(SongRepositoryType)
    private readonly songRepository: SongRepository,
    @Inject(SongToPlaylistRepositoryType)
    private readonly songToPlaylistRepository: SongToPlaylistRepository,
    @Inject(ListensRepositoryType)
    private readonly listensRepository: ListensRepository,
    @Inject(OutboxPortType)
    private readonly outbox: OutboxPort,
  ) {}

  public async execute({
    songId,
    userId,
  }: DeleteSongArguments): Promise<StatusResponse> {
    const song = await this.songRepository.getOneWhere({ id: songId });

    if (!song) {
      throw new NotFoundException('Song not found');
    }

    if (song.user_id !== userId) {
      throw new ForbiddenException('You are not allowed to delete this song');
    }

    // read before the transaction: a query outside an open transaction needs
    // a second pool connection (pool exhaustion under parallel requests)
    const songToPlaylistRecords =
      await this.songToPlaylistRepository.getAllWhere({ song_id: songId });
    const listensRecords = await this.listensRepository.getAllWhere({
      song_id: songId,
    });

    const t = await this.sequelize.transaction();

    try {
      if (songToPlaylistRecords.length > 0) {
        for (const songToPlaylistRecord of songToPlaylistRecords) {
          await this.songToPlaylistRepository.delete(
            songToPlaylistRecord.id,
            t,
          );
        }
      }

      // delete listens
      if (listensRecords.length > 0) {
        for (const listenRecord of listensRecords) {
          await this.listensRepository.delete(listenRecord.id, t);
        }
      }

      // delete all likes
      await this.commandBus.execute(new DeleteSongLikesCommand(songId, t));

      // delete song
      await this.songRepository.smartDelete(songId, t);

      await this.outbox.add(
        newEvent(
          EVENT_TYPES.songDeleted,
          { song_id: songId, author_id: song.user_id },
          userId,
        ),
        { transaction: t, aggregateType: 'song', aggregateId: songId },
      );

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw new Error('Error deleting song');
    }

    return StatusResponse.ok();
  }
}
