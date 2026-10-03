import {ConfigService} from '@nestjs/config';
import {SequelizeModuleOptions} from '@nestjs/sequelize';
import {join} from 'path';

const defaultConfig = (
  configService: ConfigService
): SequelizeModuleOptions => {
  const sequelizeParams = configService.get('db');

  return {
    ...sequelizeParams,
    synchronize: true,
    models: [
      join(
        __dirname,
        '../../../',
        'components/**/secondary-adapters/postgres/data/*.model{.ts,.js}'
      )
    ]
  };
};

export default defaultConfig;
