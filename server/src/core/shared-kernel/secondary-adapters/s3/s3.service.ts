import * as crypto from 'crypto';
import { DeleteObjectCommand, PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { S3ServiceInterface } from '../../ports/s3-service.interface';
import { Injectable } from '@nestjs/common';
import { FileObjectName } from './data/enum/file-object-name.enum';

@Injectable()
export class S3Service implements S3ServiceInterface {
  private s3: S3;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3({
      credentials: {
        accessKeyId: this.configService.get<string>('s3.accessKeyId'),
        secretAccessKey: this.configService.get<string>('s3.secretAccessKey'),
      },
      region: this.configService.get<string>('s3.region'),
    });
  }

  public async uploadFile(
    file: Express.Multer.File,
    key: string,
    group: string[],
    isPublicRead: boolean,
  ): Promise<string> {
    const groupKey = this.createFileKey(key, group);
    const bucketName = this.configService.get<string>('s3.bucket');

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Body: Buffer.from(file.buffer),
      Key: groupKey,
      ACL: isPublicRead ? 'public-read' : 'private',
      ContentType: file.mimetype,
      ContentLength: file.size,
    });

    await this.s3.send(command);

    const fileUrl = this.getFileUrl(groupKey);

    return fileUrl;
  }

  public async deleteFileByUrl(url: string): Promise<boolean> {
    const fileUrl = new URL(url);
    const bucketName = fileUrl.hostname.split('.')[0];
    const fileKey = fileUrl.pathname.substring(1);

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
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

  private getFileUrl(fileKey: string): string {
    const awsRegion = this.configService.get<string>('s3.region');
    const bucketName = this.configService.get<string>('s3.bucket');

    return `https://${bucketName}.s3.${awsRegion}.amazonaws.com/${fileKey}`;
  }
}
