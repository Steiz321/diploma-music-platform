import Configuration, { TranscriptionProvider } from './config.type';
import { loadEnv } from './load-env';

loadEnv();

const dbSslOptions = () =>
  process.env.DB_SSL === 'true'
    ? {
        ssl: {
          require: true,
          rejectUnauthorized:
            process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        },
      }
    : {};

const configure = async (): Promise<Configuration> => {
  return {
    node: {
      port: Number(process.env.PORT) || 3000,
      nodeEnv: process.env.NODE_ENV,
      encryptionKey: process.env.ENCRYPTION_KEY,
      jwtSecretKey: process.env.JWT_SECRET_KEY,
      logLevel: process.env.LOG_LEVEL || 'info',
    },
    swagger: {
      username: process.env.API_DOCS_USER,
      password: process.env.API_DOCS_PASSWORD,
    },
    db: {
      dialect: 'postgres',
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      logging: false,
      define: {
        timestamps: false,
      },
      dialectOptions: dbSslOptions(),
    },
    s3: {
      endpoint: process.env.S3_ENDPOINT || undefined,
      region: process.env.S3_REGION,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      bucket: process.env.S3_BUCKET,
      publicBaseUrl: process.env.PUBLIC_FILES_BASE_URL?.replace(/\/+$/, ''),
    },
    transcription: {
      provider: (process.env.TRANSCRIPTION_PROVIDER ||
        'fake') as TranscriptionProvider,
      groqApiKey: process.env.GROQ_API_KEY,
      fakeDelayMs: Number(process.env.FAKE_TRANSCRIPTION_DELAY_MS) || 0,
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
  };
};

export const config: Promise<Configuration> = configure();

export default (): Promise<Configuration> => config;
