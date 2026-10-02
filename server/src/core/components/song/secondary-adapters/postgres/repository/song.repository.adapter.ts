import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SongRepository } from '../../../ports/song.repository';
import { Song } from '../../../application/data/song.dto';
import SongModel from '../data/song.model';
import { GetSongWhere } from '../query-params/song/get-song-where.params';
import { SongCreateParams } from '../query-params/song/create-song.params';
import { Sequelize, Transaction } from 'sequelize';
import { SongUpdateParams } from '../query-params/song/update-song.params';

@Injectable()
export class SongRepositoryAdapter implements SongRepository {
  constructor(
    @InjectModel(SongModel)
    private readonly songModel: typeof SongModel,
  ) {}
  async getAll(search: string): Promise<Song[]> {
    // match the search text literally: escape LIKE wildcards and the escape char,
    // then let Sequelize quote the whole pattern as a SQL string
    const escapedSearch = (search || '').replace(/[\\%_]/g, '\\$&');
    const searchPattern = this.songModel.sequelize.escape(
      `%${escapedSearch}%`,
    );

    const songs = await this.songModel.findAll({
      where: {
        deleted_at: null,
      },
      include: [
        {
          association: 'user',
          required: true,
        },
      ],
      order: [
        [
          Sequelize.literal(`
            CASE
              WHEN name ILIKE ${searchPattern} ESCAPE '\\' THEN 0
              ELSE 1
            END
          `),
          'ASC',
        ],
        ['created_at', 'DESC'],
      ],
    });

    return songs.map((song) => song.toJSON());
  }

  async getOneWhere(where: GetSongWhere): Promise<Song> {
    const song = await this.songModel.findOne({
      where: { ...where, deleted_at: null },
      include: [
        {
          association: 'user',
          required: true,
        },
      ],
    });
    return song?.toJSON() || null;
  }

  async getManyWhere(where: GetSongWhere): Promise<Song[]> {
    const songs = await this.songModel.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
    return songs.map((song) => song.toJSON());
  }

  async create(
    dto: SongCreateParams,
    transaction?: Transaction,
  ): Promise<Song> {
    const song = await this.songModel.create(dto, { transaction });
    return song?.toJSON() || null;
  }

  async update(
    what: SongUpdateParams,
    where: GetSongWhere,
    transaction?: Transaction,
  ): Promise<Song> {
    const song = await this.songModel.update(what, {
      where,
      transaction,
      returning: true,
    });

    return song[1][0].toJSON() || null;
  }

  async smartDelete(
    songId: number,
    transaction?: Transaction,
  ): Promise<undefined> {
    await this.songModel.update(
      { deleted_at: new Date() },
      { where: { id: songId }, transaction },
    );
  }
}
