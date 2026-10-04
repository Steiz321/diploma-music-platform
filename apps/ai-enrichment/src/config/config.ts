import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import Configuration, { Provider } from './config.type';

// apps/ai-enrichment/.env is optional: in Docker the variables come from the
// environment, and they take precedence over the file
const envPath = resolve(__dirname, '../..', '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const configure = (): Configuration => ({
  node: {
    port: Number(process.env.PORT) || 3001,
    logLevel: process.env.LOG_LEVEL || 'info',
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
  s3: {
    endpoint: process.env.S3_ENDPOINT || undefined,
    region: process.env.S3_REGION,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    bucket: process.env.S3_BUCKET,
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
  transcription: {
    provider: (process.env.TRANSCRIPTION_PROVIDER || 'fake') as Provider,
    groqApiKey: process.env.GROQ_API_KEY,
    fakeDelayMs: Number(process.env.FAKE_TRANSCRIPTION_DELAY_MS) || 0,
  },
  analysis: {
    provider: (process.env.LLM_PROVIDER || 'fake') as Provider,
    groqApiKey: process.env.GROQ_API_KEY,
    fakeDelayMs: Number(process.env.FAKE_LLM_DELAY_MS) || 0,
  },
});

export default configure;
