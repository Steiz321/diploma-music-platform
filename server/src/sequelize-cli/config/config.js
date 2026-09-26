const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// server/.env is optional: in Docker the variables come from the environment,
// and they take precedence over the file.
const envPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const dbSslOptions =
  process.env.DB_SSL === 'true'
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        },
      }
    : {};

module.exports = {
  dialect: 'postgres',
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  logging: false,
  define: {
    timestamps: false,
  },
  dialectOptions: dbSslOptions,
  seederStorage: 'sequelize',
  seederStorageTableName: 'seeder_actions',
};
