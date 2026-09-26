import { SequelizeModuleOptions } from '@nestjs/sequelize';

interface NodeConfig {
  nodeEnv: string;
  port: number;
  encryptionKey: string;
  jwtSecretKey: string;
}

export interface SwaggerConfig {
  username: string;
  password: string;
}

export interface S3Config {
  // custom endpoint for S3-compatible storage (MinIO); empty for AWS S3
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  // base URL the browser uses to download files, e.g. http://localhost:9000/<bucket>
  publicBaseUrl: string;
}

export type TranscriptionProvider = 'groq' | 'fake';

export interface TranscriptionConfig {
  provider: TranscriptionProvider;
  groqApiKey?: string;
  fakeDelayMs: number;
}

export default interface Configuration {
  node: NodeConfig;
  db: SequelizeModuleOptions;
  swagger: SwaggerConfig;
  s3: S3Config;
  transcription: TranscriptionConfig;
}
