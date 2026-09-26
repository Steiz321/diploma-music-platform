const path = require('path');
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../../../env/.env');
console.log('Loading env from:', envPath);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Error loading .env file:', result.error);
  throw result.error;
}

console.log('Environment variables loaded successfully');

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
  // it fixes error: no pg_hba.conf entry for host
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  seederStorage: 'sequelize',
  seederStorageTableName: 'seeder_actions',
};
