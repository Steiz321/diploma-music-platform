import { ConfigService } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

const defaultConfig = (
  configService: ConfigService,
): SequelizeModuleOptions => {
  const sequelizeParams = configService.get('db');

  return {
    ...sequelizeParams,
    // every model registered with SequelizeModule.forFeature is added to the
    // connection, including the outbox/inbox models of @platform/messaging
    autoLoadModels: true,
    // the schema comes only from migrations
    synchronize: false,
  };
};

export default defaultConfig;
