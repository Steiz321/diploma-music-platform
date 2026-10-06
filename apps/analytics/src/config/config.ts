import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import Configuration from './config.type';

// apps/analytics/.env is optional: in Docker the variables come from the
// environment, and they take precedence over the file
const envPath = resolve(__dirname, '../..', '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const configure = (): Configuration => ({
  node: {
    port: Number(process.env.PORT) || 3002,
    logLevel: process.env.LOG_LEVEL || 'info',
    debugEndpoints: process.env.ANALYTICS_DEBUG_ENDPOINTS === 'true',
  },
  db: {
    dialect: 'postgres',
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    logging: false,
    define: { timestamps: false },
  },
  rabbitmq: {
    uri: process.env.RABBITMQ_URL,
    publishTimeoutMs: Number(process.env.RABBITMQ_PUBLISH_TIMEOUT_MS) || 5000,
  },
  outbox: {
    relayIntervalMs: Number(process.env.OUTBOX_RELAY_INTERVAL_MS) || 1000,
    batchSize: Number(process.env.OUTBOX_RELAY_BATCH_SIZE) || 100,
    retentionDays: 7,
  },
  profiles: {
    recomputeIntervalMs:
      Number(process.env.PROFILE_RECOMPUTE_INTERVAL_MS) || 60_000,
    batchSize: Number(process.env.PROFILE_RECOMPUTE_BATCH_SIZE) || 100,
    publishThreshold: 0.01,
  },
});

export default configure;
