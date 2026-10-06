import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { OutboxOptions } from '@platform/messaging';
import { RankingWeights } from '../ranking/ranking';

export interface RabbitMQConfig {
  uri: string;
  publishTimeoutMs: number;
}

export default interface Configuration {
  node: { port: number; logLevel: string };
  db: SequelizeModuleOptions;
  rabbitmq: RabbitMQConfig;
  outbox: OutboxOptions;
  /** "For you": profile similarity, similar listeners, popularity */
  userWeights: RankingWeights;
  /** "Similar tracks": tag similarity, co-liked, popularity */
  similarWeights: RankingWeights;
}
