import * as dotenv from 'dotenv';
import Configuration from './config.type';

dotenv.config({ path: `env/.env` });

const configure = async (): Promise<Configuration> => {
  return {
    node: {
      port: Number(process.env.PORT),
      nodeEnv: process.env.NODE_ENV,
      encryptionKey: process.env.ENCRYPTION_KEY,
      jwtSecretKey: process.env.JWT_SECRET_KEY,
    },
    swagger: {
      username: process.env.DOCS_USER,
      password: process.env.DOCS_PASSWORD,
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
      // it fixes error: no pg_hba.conf entry for host
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    },
    aws: {
      filesBucketName: process.env.BUCKET_NAME,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      defaultRegion: process.env.AWS_REGION,
    },
    assembly: {
      apiKey: process.env.ASSEMBLY_API_KEY,
    },
  };
};

export const config: Promise<Configuration> = configure();

export default (): Promise<Configuration> => config;
