import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalysisConfig } from '../config/config.type';
import { AnalyzerType } from './analyzer';
import { GroqAnalyzer } from './groq-analyzer';
import { FakeAnalyzer } from './fake-analyzer';

@Module({
  providers: [
    {
      provide: AnalyzerType,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get<AnalysisConfig>('analysis');

        switch (config.provider) {
          case 'groq':
            return new GroqAnalyzer(config.groqApiKey);
          case 'fake':
            return new FakeAnalyzer(config.fakeDelayMs);
          default:
            throw new Error(
              `Unknown LLM_PROVIDER "${config.provider}", expected groq | fake`,
            );
        }
      },
    },
  ],
  exports: [AnalyzerType],
})
export class AnalysisModule {}
