import {ConfigService} from '@nestjs/config';
import {JwtModuleOptions} from '@nestjs/jwt';

export const jwtTokenConfig = (
  configService: ConfigService
): JwtModuleOptions => {
  return {
    secret: configService.get<string>('node.jwtSecretKey')
  };
};
