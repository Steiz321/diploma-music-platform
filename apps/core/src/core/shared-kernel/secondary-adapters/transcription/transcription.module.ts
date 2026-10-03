import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TranscriptionConfig } from 'src/core/configuration/config.type';
import { TranscriptionServiceInterfaceType } from '../../ports/transcription-service.interface';
import {
  S3ServiceInterface,
  S3ServiceInterfaceType,
} from '../../ports/s3-service.interface';
import { S3Module } from '../s3/s3.module';
import { GroqTranscriptionAdapter } from './groq-transcription.adapter';
import { FakeTranscriptionAdapter } from './fake-transcription.adapter';

@Global()
@Module({
  imports: [S3Module],
  providers: [
    {
      provide: TranscriptionServiceInterfaceType,
      inject: [ConfigService, S3ServiceInterfaceType],
      useFactory: (
        configService: ConfigService,
        s3Service: S3ServiceInterface,
      ) => {
        const config = configService.get<TranscriptionConfig>('transcription');

        switch (config.provider) {
          case 'groq':
            return new GroqTranscriptionAdapter(config.groqApiKey, s3Service);
          case 'fake':
            return new FakeTranscriptionAdapter(config.fakeDelayMs);
          default:
            throw new Error(
              `Unknown TRANSCRIPTION_PROVIDER "${config.provider}", expected groq | fake`,
            );
        }
      },
    },
  ],
  exports: [TranscriptionServiceInterfaceType],
})
export class TranscriptionModule {}
