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

export interface AwsConfig {
  accessKeyId: string;
  secretAccessKey: string;
  defaultRegion: string;
  filesBucketName: string;
}

export interface AssemblyConfig {
  apiKey: string;
}

export default interface Configuration {
  node: NodeConfig;
  db: SequelizeModuleOptions;
  swagger: SwaggerConfig;
  aws: AwsConfig;
  assembly: AssemblyConfig;
}
