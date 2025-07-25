// packages/utils/src/env.ts

import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import fs from 'fs';
// --- START: Environment Variable Loading Logic (TEMPORARY DEBUGGING) ---
// FOR DEBUGGING ONLY: We are intentionally removing the NODE_ENV check
// and forcing dotenv.config() to run with override: true
// to see if it can load these variables.
// DO NOT KEEP THIS IN PRODUCTION.
//
// const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'ci';
// if (!isProduction) {
function findMonorepoRoot(startDir: string): string | null {
  let currentDir = startDir;
  while (currentDir !== path.parse(currentDir).root) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    const envPath = path.join(currentDir, '.env');
    if (fs.existsSync(packageJsonPath) && fs.existsSync(envPath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  return null;
}

const startDirForEnv = process.cwd();
const monorepoRoot = findMonorepoRoot(startDirForEnv);

if (monorepoRoot) {
  const envPath = path.join(monorepoRoot, '.env');
  // Force override to true to see if dotenv can set these values
  // if a .env file is present with them.
  dotenv.config({ path: envPath, override: true });
  console.log('--- ENV DEBUG (from env.ts - Local .env loaded - FORCED) ---');
  console.log('Monorepo Root Found:', monorepoRoot);
  console.log('Attempting to load .env from:', envPath);
} else {
  console.warn('--- ENV DEBUG (from env.ts - Local .env fallback - FORCED) ---');
  console.warn('Could not find monorepo root. Falling back to default .env loading (CWD).');
  dotenv.config({ override: true }); // Force override here too
}
// }
// --- END: Environment Variable Loading Logic (TEMPORARY DEBUGGING) ---

// ... (rest of the file is the same) ...

// Keep these optional for now to avoid crashes during this test
export const envSchema = z.object({
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  MONGO_URI: z.string().url(),
  AUTH_SERVICE_URL: z.string().url().optional(),
  URL_SERVICE_URL: z.string().url().optional(),
});

// Parse process.env against the schema to validate and get typed environment variables
export const env = envSchema.parse(process.env);

console.log('--- ENV DEBUG (after validation) ---');
console.log('GOOGLE_CLIENT_ID (validated):', env.GOOGLE_CLIENT_ID ? 'Loaded' : 'MISSING');
console.log('GOOGLE_CLIENT_SECRET (validated):', env.GOOGLE_CLIENT_SECRET ? 'Loaded' : 'MISSING');
console.log('MONGO_URI (validated):', env.MONGO_URI ? 'Loaded' : 'MISSING');
console.log(
  'AUTH_SERVICE_URL (validated):',
  env.AUTH_SERVICE_URL
    ? 'Loaded auth_service_url: ' + env.AUTH_SERVICE_URL
    : "Couldn't load auth_service_url",
);
console.log(
  'URL_SERVICE_URL (validated):',
  env.URL_SERVICE_URL
    ? 'Loaded url_service_url: ' + env.URL_SERVICE_URL
    : "Couldn't load url_service_url",
);
console.log('--- END ENV DEBUG (after validation) ---');
