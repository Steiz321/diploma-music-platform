import {Global, Module} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {jwtTokenConfig} from './token.configuration';
import {TokenServiceInterfaceType} from '../../ports/token-service.interface';
import {TokenService} from './token.service';
import {ConfigService} from '@nestjs/config';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      // strange thing, it's only works when I delete imports: [ConfigModule]
      useFactory: (configService: ConfigService) =>
        jwtTokenConfig(configService),
      inject: [ConfigService]
    })
  ],
  providers: [
    {
      provide: TokenServiceInterfaceType,
      useClass: TokenService
    }
  ],
  exports: [TokenServiceInterfaceType]
})
export class TokenModule {}
