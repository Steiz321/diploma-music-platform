import { Injectable, NotFoundException } from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import {
  SongRepository,
  SongRepositoryType,
} from '../../ports/song.repository';
import {
  ListensRepository,
  ListensRepositoryType,
} from '../../ports/listens.repository';
import { Inject } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { StatusResponse } from 'src/core/shared-kernel/rest/dto/status-response.dto';

interface CreateListenForSongArguments {
  songId: number;
  userId: number;
}

@Injectable()
export default class CreateListenForSongUseCase
  implements UseCase<CreateListenForSongArguments, StatusResponse>
{
  constructor(
    private readonly sequelize: Sequelize,
    @Inject(SongRepositoryType)
    private readonly songRepository: SongRepository,
    @Inject(ListensRepositoryType)
    private readonly listensRepository: ListensRepository,
  ) {}

  public async execute({
    songId,
    userId,
  }: CreateListenForSongArguments): Promise<StatusResponse> {
    const song = await this.songRepository.getOneWhere({
      id: songId,
    });

    if (!song) {
      throw new NotFoundException('Song not found');
    }

    // the listens log and the denormalized counter change together
    await this.sequelize.transaction(async (t) => {
      await this.listensRepository.create(
        { song_id: songId, user_id: userId },
        t,
      );
      await this.songRepository.incrementListens(songId, t);
    });

    return StatusResponse.ok();
  }
}
