import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { OutboxOptions } from '@platform/messaging';

export interface RabbitMQConfig {
  uri: string;
  publishTimeoutMs: number;
}

export interface ProfilesConfig {
  /** how often changed users get their scores and profile recomputed */
  recomputeIntervalMs: number;
  /** users recomputed per run */
  batchSize: number;
  /** smallest change of any vector value that is published */
  publishThreshold: number;
}

export default interface Configuration {
  node: {
    port: number;
    logLevel: string;
    /** GET /profiles/:userId exposes listening data without auth: dev only */
    debugEndpoints: boolean;
  };
  db: SequelizeModuleOptions;
  rabbitmq: RabbitMQConfig;
  outbox: OutboxOptions;
  profiles: ProfilesConfig;
}
