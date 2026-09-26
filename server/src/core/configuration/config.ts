import Configuration, { TranscriptionProvider } from './config.type';
import { loadEnv } from './load-env';

loadEnv();

const dbSslOptions = () =>
  process.env.DB_SSL === 'true'
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
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
    // TODO(step 4): removed together with the AssemblyAI adapter
    assembly: {
      apiKey: process.env.ASSEMBLY_API_KEY,
    },
  };
};

export const config: Promise<Configuration> = configure();

export default (): Promise<Configuration> => config;
