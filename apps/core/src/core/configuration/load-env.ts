import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// apps/core/ root: the same relative path works from src/ (ts-node, watch) and dist/
const SERVER_ROOT = resolve(__dirname, '../../..');

// Loads apps/core/.env when it exists. Variables already present in the
// environment (e.g. passed by Docker) take precedence over the file.
export const loadEnv = (): void => {
  const envPath = resolve(SERVER_ROOT, '.env');

  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
};
