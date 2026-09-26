import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import defaultConfig from './postgres.configuration';
import {ConfigService} from '@nestjs/config';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => defaultConfig(configService)
    })
  ],
  exports: [SequelizeModule]
})
export class PostgresConnectionModule {}
