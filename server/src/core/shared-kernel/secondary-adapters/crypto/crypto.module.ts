import {Global, Module} from '@nestjs/common';
import {CryptoServiceInterfaceType} from 'src/core/shared-kernel/ports/crypto-service.interface';
import {CryptoService} from './crypto.service';

@Global()
@Module({
  providers: [
    {
      provide: CryptoServiceInterfaceType,
      useClass: CryptoService
    }
  ],
  exports: [CryptoServiceInterfaceType]
})
export class CryptoModule {}
