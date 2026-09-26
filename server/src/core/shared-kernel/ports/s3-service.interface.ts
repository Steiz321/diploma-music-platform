import { FileObjectName } from '../secondary-adapters/s3/data/enum/file-object-name.enum';

export interface S3ServiceInterface {
  uploadFile(
    file: Express.Multer.File,
    key: string,
    group: string[],
    isPublicRead: boolean,
  ): Promise<string>;

  formatFileName(fileName: string, objectName: FileObjectName): string;

  deleteFileByUrl(url: string): Promise<boolean>;
}

export const S3ServiceInterfaceType = Symbol.for('S3ServiceInterface');
