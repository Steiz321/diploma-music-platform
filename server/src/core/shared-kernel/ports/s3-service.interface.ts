import { FileObjectName } from '../secondary-adapters/s3/data/enum/file-object-name.enum';

export interface UploadedFile {
  // object key in the bucket, e.g. song/song&1a2b3c4d5e6f7a8b.mp3
  key: string;
  // public URL the browser downloads the file from
  url: string;
}

export interface S3ServiceInterface {
  uploadFile(
    file: Express.Multer.File,
    key: string,
    group: string[],
  ): Promise<UploadedFile>;

  getFile(key: string): Promise<Buffer>;

  formatFileName(fileName: string, objectName: FileObjectName): string;

  deleteFileByUrl(url: string): Promise<boolean>;
}

export const S3ServiceInterfaceType = Symbol.for('S3ServiceInterface');
