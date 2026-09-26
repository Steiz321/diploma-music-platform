import { Injectable, NotFoundException } from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import { CreatePlaylistRequest } from '../data/request/create-playlist.request';
import {
  SongRepository,
  SongRepositoryType,
} from '../../ports/song.repository';
import { Inject } from '@nestjs/common';
import { StatusResponse } from 'src/core/shared-kernel/rest/dto/status-response.dto';

interface CreateListenForSongArguments {
  songId: number;
}

@Injectable()
export default class CreateListenForSongUseCase
  implements UseCase<CreateListenForSongArguments, StatusResponse>
{
  constructor(
    @Inject(SongRepositoryType)
    private readonly songRepository: SongRepository,
  ) {}

  public async execute({
    songId,
  }: CreateListenForSongArguments): Promise<StatusResponse> {
    const song = await this.songRepository.getOneWhere({
      id: songId,
    });

    if (!song) {
      throw new NotFoundException('Song not found');
    }

    await this.songRepository.update(
      {
        listens: song.listens + 1,
      },
      { id: songId },
    );

    return StatusResponse.ok();
  }
}
