import {Module} from '@nestjs/common';
import {S3ServiceInterfaceType} from '../../ports/s3-service.interface';
import {S3Service} from './s3.service';

@Module({
  providers: [
    {
      provide: S3ServiceInterfaceType,
      useClass: S3Service
    }
  ],
  exports: [S3ServiceInterfaceType]
})
export class S3Module {}
