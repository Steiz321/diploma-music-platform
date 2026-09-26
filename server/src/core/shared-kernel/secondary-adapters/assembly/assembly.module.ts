import { Global, Module } from '@nestjs/common';
import { AssemblyServiceInterfaceType } from '../../ports/assembly-service.interface';
import { AssemblyService } from './assembly.service';

@Global()
@Module({
  providers: [
    {
      provide: AssemblyServiceInterfaceType,
      useClass: AssemblyService,
    },
  ],
  exports: [AssemblyServiceInterfaceType],
})
export class AssemblyModule {}
