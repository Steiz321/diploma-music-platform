import * as crypto from 'crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import {
  S3ServiceInterface,
  UploadedFile,
} from '../../ports/s3-service.interface';
import { Injectable } from '@nestjs/common';
import { FileObjectName } from './data/enum/file-object-name.enum';
import { S3Config } from 'src/core/configuration/config.type';
import { buildPublicFileUrl } from '../../common/public-file-url.util';

@Injectable()
export class S3Service implements S3ServiceInterface {
  private s3: S3;
  private readonly config: S3Config;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<S3Config>('s3');

    this.s3 = new S3({
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      region: this.config.region,
      // S3-compatible storage (MinIO) is addressed as <endpoint>/<bucket>/<key>
      ...(this.config.endpoint && {
        endpoint: this.config.endpoint,
        forcePathStyle: true,
      }),
    });
  }

  // Public read access is granted by the bucket policy, not per object
  public async uploadFile(
    file: Express.Multer.File,
    key: string,
    group: string[],
  ): Promise<UploadedFile> {
    const groupKey = this.createFileKey(key, group);

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Body: Buffer.from(file.buffer),
      Key: groupKey,
      ContentType: file.mimetype,
      ContentLength: file.size,
    });

    await this.s3.send(command);

    return {
      key: groupKey,
      url: buildPublicFileUrl(groupKey, this.config.publicBaseUrl),
    };
  }

  public async getFile(key: string): Promise<Buffer> {
    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }),
    );

    return Buffer.from(await response.Body.transformToByteArray());
  }

  public async deleteFileByUrl(url: string): Promise<boolean> {
    const baseUrl = `${this.config.publicBaseUrl}/`;
    if (!url.startsWith(baseUrl)) {
      return false;
    }

    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: decodeURIComponent(url.substring(baseUrl.length)),
    });

    await this.s3.send(command);

    return true;
  }

  public formatFileName(fileName: string, objectName: FileObjectName): string {
    const hash = crypto.randomBytes(8).toString('hex');
    const formattedFileName = `${objectName.toLowerCase()}&${hash}`;

    const fileExtension = fileName.split('.').at(-1);
    return `${formattedFileName}.${fileExtension}`;
  }

  private createFileKey(fileKey: string, fileGroup: string[]) {
    return `${fileGroup}/${fileKey}`;
  }
}
