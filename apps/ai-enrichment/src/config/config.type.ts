import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { OutboxOptions } from '@platform/messaging';

export type Provider = 'groq' | 'fake';

export interface TranscriptionConfig {
  provider: Provider;
  groqApiKey?: string;
  fakeDelayMs: number;
}

export interface AnalysisConfig {
  provider: Provider;
  groqApiKey?: string;
  fakeDelayMs: number;
}

export interface S3Config {
  // custom endpoint for S3-compatible storage (MinIO); empty for AWS S3
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export interface RabbitMQConfig {
  uri: string;
  publishTimeoutMs: number;
}

export default interface Configuration {
  node: { port: number; logLevel: string };
  db: SequelizeModuleOptions;
  s3: S3Config;
  rabbitmq: RabbitMQConfig;
  outbox: OutboxOptions;
  transcription: TranscriptionConfig;
  analysis: AnalysisConfig;
}
