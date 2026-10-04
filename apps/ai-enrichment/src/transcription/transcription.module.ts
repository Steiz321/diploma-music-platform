import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TranscriptionConfig } from '../config/config.type';
import { TranscriberType } from './transcriber';
import { GroqTranscriber } from './groq-transcriber';
import { FakeTranscriber } from './fake-transcriber';

@Module({
  providers: [
    {
      provide: TranscriberType,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get<TranscriptionConfig>('transcription');

        switch (config.provider) {
          case 'groq':
            return new GroqTranscriber(config.groqApiKey);
          case 'fake':
            return new FakeTranscriber(config.fakeDelayMs);
          default:
            throw new Error(
              `Unknown TRANSCRIPTION_PROVIDER "${config.provider}", expected groq | fake`,
            );
        }
      },
    },
  ],
  exports: [TranscriberType],
})
export class TranscriptionModule {}
