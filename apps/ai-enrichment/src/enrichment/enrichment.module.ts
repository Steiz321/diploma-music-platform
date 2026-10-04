import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TranscriptionModule } from '../transcription/transcription.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { AudioStorage } from '../storage/audio-storage';
import SongEnrichmentModel from './song-enrichment.model';
import { EnrichmentRepository } from './enrichment.repository';
import { EnrichmentService } from './enrichment.service';
import { SongUploadedConsumer } from './song-uploaded.consumer';

@Module({
  imports: [
    SequelizeModule.forFeature([SongEnrichmentModel]),
    TranscriptionModule,
    AnalysisModule,
  ],
  providers: [
    AudioStorage,
    EnrichmentRepository,
    EnrichmentService,
    SongUploadedConsumer,
  ],
})
export class EnrichmentModule {}
