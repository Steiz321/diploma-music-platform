import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, NoSuchKey, S3Client } from '@aws-sdk/client-s3';
import { S3Config } from '../config/config.type';

/** The object does not exist: retrying will not help. */
export class AudioNotFoundError extends Error {
  constructor(key: string) {
    super(`Audio file not found in storage: ${key}`);
    this.name = 'AudioNotFoundError';
  }
}

/** Read-only access to uploaded audio files in S3 / MinIO. */
@Injectable()
export class AudioStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(configService: ConfigService) {
    const config = configService.get<S3Config>('s3');
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      // MinIO serves buckets by path, not by subdomain
      forcePathStyle: !!config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async getAudio(key: string): Promise<Buffer> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return Buffer.from(await response.Body.transformToByteArray());
    } catch (err) {
      if (err instanceof NoSuchKey) {
        throw new AudioNotFoundError(key);
      }
      throw err;
    }
  }
}
