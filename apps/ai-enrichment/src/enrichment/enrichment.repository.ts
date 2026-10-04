import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import SongEnrichmentModel from './song-enrichment.model';

export type EnrichmentUpdate = Partial<
  Pick<
    SongEnrichmentModel,
    | 'status'
    | 'transcription'
    | 'lyrics'
    | 'tags'
    | 'vocabulary_version'
    | 'last_error'
  >
>;

@Injectable()
export class EnrichmentRepository {
  constructor(
    @InjectModel(SongEnrichmentModel)
    private readonly songEnrichmentModel: typeof SongEnrichmentModel,
    private readonly sequelize: Sequelize,
  ) {}

  transaction<T>(work: (transaction: Transaction) => Promise<T>): Promise<T> {
    return this.sequelize.transaction(work);
  }

  /** Creates the row or starts a new attempt for it. */
  async markProcessing(songId: number, audioKey: string): Promise<void> {
    await this.sequelize.query(
      `INSERT INTO song_enrichments (song_id, audio_key, status, attempts)
       VALUES (:songId, :audioKey, 'processing', 1)
       ON CONFLICT (song_id) DO UPDATE
         SET status = 'processing',
             audio_key = EXCLUDED.audio_key,
             attempts = song_enrichments.attempts + 1,
             updated_at = now()`,
      { replacements: { songId, audioKey } },
    );
  }

  async save(
    songId: number,
    values: EnrichmentUpdate,
    transaction: Transaction,
  ): Promise<void> {
    await this.songEnrichmentModel.update(
      { ...values, updated_at: new Date() },
      { where: { song_id: songId }, transaction },
    );
  }
}
