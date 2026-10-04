import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import {
  SongTags,
  StructuredLyrics,
  TranscriptionResult,
} from '@platform/contracts';

export enum EnrichmentStatus {
  processing = 'processing',
  done = 'done',
  no_lyrics = 'no_lyrics',
  failed = 'failed',
}

/** Result of enriching one song, owned by this service. */
@Table({ tableName: 'song_enrichments' })
export default class SongEnrichmentModel extends Model<SongEnrichmentModel> {
  @PrimaryKey
  @Column(DataType.INTEGER)
  song_id: number;

  @AllowNull(false)
  @Column(DataType.TEXT)
  audio_key: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(EnrichmentStatus)))
  status: EnrichmentStatus;

  @AllowNull
  @Column(DataType.JSONB)
  transcription: TranscriptionResult | null;

  @AllowNull
  @Column(DataType.JSONB)
  lyrics: StructuredLyrics | null;

  @AllowNull
  @Column(DataType.JSONB)
  tags: SongTags | null;

  @AllowNull
  @Column(DataType.INTEGER)
  vocabulary_version: number | null;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  attempts: number;

  @AllowNull
  @Column(DataType.TEXT)
  last_error: string | null;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  created_at: Date;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  updated_at: Date;
}
