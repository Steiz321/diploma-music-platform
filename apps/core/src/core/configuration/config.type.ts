import { SequelizeModuleOptions } from '@nestjs/sequelize';

interface NodeConfig {
  nodeEnv: string;
  port: number;
  encryptionKey: string;
  jwtSecretKey: string;
  // pino level: trace | debug | info | warn | error
  logLevel: string;
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

export interface RabbitMQConfig {
  // amqp://user:password@host:5672
  uri: string;
  // how long a publish waits for the broker confirm
  publishTimeoutMs: number;
}

export interface OutboxConfig {
  // how often the relay looks for unpublished events
  relayIntervalMs: number;
  // max events published per relay cycle
  batchSize: number;
  // published events older than this are deleted daily
  retentionDays: number;
}

export default interface Configuration {
  node: NodeConfig;
  db: SequelizeModuleOptions;
  swagger: SwaggerConfig;
  s3: S3Config;
  rabbitmq: RabbitMQConfig;
  outbox: OutboxConfig;
}
