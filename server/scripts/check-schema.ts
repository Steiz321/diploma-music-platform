/**
 * Compares Sequelize models with the actual tables in the database.
 * Run after `npm run migration:run`:  npm run schema:check
 *
 * Checks, for every model: missing / extra columns, type family and
 * nullability. Exits with code 1 when mismatches are found.
 */
import { join } from 'path';
import { Sequelize } from 'sequelize-typescript';
import { ModelAttributeColumnOptions } from 'sequelize';
import appConfig from '../src/core/configuration/config';

// Tables created by migrations that intentionally have no model yet
const TABLES_WITHOUT_MODEL = [
  'subscription',
  'SequelizeMeta',
  'seeder_actions',
];

const normalizeModelType = (attr: ModelAttributeColumnOptions): string => {
  const key = (attr.type as any).key as string;
  switch (key) {
    case 'STRING':
      return 'varchar';
    case 'TEXT':
      return 'text';
    case 'INTEGER':
      return 'integer';
    case 'BOOLEAN':
      return 'boolean';
    case 'DATE':
      return 'timestamptz';
    case 'ENUM':
      return 'enum';
    case 'JSONB':
      return 'jsonb';
    default:
      return key.toLowerCase();
  }
};

const normalizeDbType = (dbType: string): string => {
  const type = dbType.toUpperCase();
  if (type.startsWith('CHARACTER VARYING')) return 'varchar';
  if (type === 'TEXT') return 'text';
  if (type === 'INTEGER') return 'integer';
  if (type === 'BOOLEAN') return 'boolean';
  if (type === 'TIMESTAMP WITH TIME ZONE') return 'timestamptz';
  if (type === 'USER-DEFINED') return 'enum';
  if (type === 'JSONB') return 'jsonb';
  return type.toLowerCase();
};

async function main() {
  const { db } = await appConfig();

  const sequelize = new Sequelize({
    ...db,
    models: [
      join(
        __dirname,
        '../src/core/components/**/secondary-adapters/postgres/data/*.model.ts',
      ),
    ],
  } as any);

  const errors: string[] = [];
  const queryInterface = sequelize.getQueryInterface();
  const dbTables = (await queryInterface.showAllTables()).map(String);

  for (const model of Object.values(sequelize.models)) {
    const table = model.getTableName() as string;

    if (!dbTables.includes(table)) {
      errors.push(`${table}: table does not exist`);
      continue;
    }

    const columns = await queryInterface.describeTable(table);
    const attributes = model.getAttributes();

    for (const [name, attr] of Object.entries(attributes)) {
      const field = attr.field ?? name;
      const column = columns[field];

      if (!column) {
        errors.push(`${table}.${field}: column missing in database`);
        continue;
      }

      const modelType = normalizeModelType(attr);
      const dbType = normalizeDbType(column.type);
      if (modelType !== dbType) {
        errors.push(
          `${table}.${field}: type model=${modelType} db=${column.type}`,
        );
      }

      // Model allows NULL (explicitly or by default) but the column does not
      const modelAllowsNull = attr.allowNull !== false && !attr.primaryKey;
      const dbAllowsNull = column.allowNull;
      const hasDbDefault = column.defaultValue !== null;
      if (modelAllowsNull && !dbAllowsNull && !hasDbDefault) {
        errors.push(
          `${table}.${field}: model allows NULL, database is NOT NULL without default`,
        );
      }
      if (!modelAllowsNull && dbAllowsNull) {
        errors.push(
          `${table}.${field}: model is NOT NULL, database allows NULL`,
        );
      }
    }

    const modelFields = Object.entries(attributes).map(
      ([name, attr]) => attr.field ?? name,
    );
    for (const field of Object.keys(columns)) {
      if (!modelFields.includes(field)) {
        errors.push(`${table}.${field}: column not described in model`);
      }
    }
  }

  const modelTables = Object.values(sequelize.models).map(
    (model) => model.getTableName() as string,
  );
  const orphanTables = dbTables.filter(
    (table) =>
      !modelTables.includes(table) && !TABLES_WITHOUT_MODEL.includes(table),
  );
  for (const table of orphanTables) {
    errors.push(`${table}: table has no model`);
  }

  await sequelize.close();

  console.log(
    `Checked ${modelTables.length} models against ${dbTables.length} tables.`,
  );
  if (errors.length) {
    console.error(`Found ${errors.length} mismatch(es):`);
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }
  console.log('Schema matches models.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
