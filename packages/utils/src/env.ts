// packages/utils/src/env.ts

import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import fs from 'fs';

// --- START: Environment Variable Loading Logic (FINAL MODIFICATION) ---
// This block will only attempt to load .env files if not in a production environment.
// On Render, process.env variables are already available.
if (process.env.NODE_ENV !== 'production') {
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
    // Add override: false to prevent overwriting Render's variables if this runs
    dotenv.config({ path: envPath, override: false });
    console.log('--- ENV DEBUG (from env.ts - Local .env loaded) ---');
    console.log('Monorepo Root Found:', monorepoRoot);
    console.log('Attempting to load .env from:', envPath);
  } else {
    console.warn('--- ENV DEBUG (from env.ts - Local .env fallback) ---');
    console.warn('Could not find monorepo root. Falling back to default .env loading (CWD).');
    // Add override: false here too
    dotenv.config({ override: false });
  }
}
// --- END: Environment Variable Loading Logic ---

// --- START: Logging actual process.env values (ALWAYS log these for debugging) ---
console.log('--- ENV DEBUG (from env.ts - from process.env) ---');
console.log(
  'GOOGLE_CLIENT_ID (from process.env in env.ts):',
  process.env.GOOGLE_CLIENT_ID ? 'Loaded' : 'MISSING',
);
console.log(
  'GOOGLE_CLIENT_SECRET (from process.env in env.ts):',
  process.env.GOOGLE_CLIENT_SECRET ? 'Loaded' : 'MISSING',
);
console.log(
  'MONGO_URI (from process.env in env.ts):',
  process.env.MONGO_URI ? 'Loaded' : 'MISSING',
);
console.log(
  'AUTH_SERVICE_URL (from process.env in env.ts):',
  process.env.AUTH_SERVICE_URL ? process.env.AUTH_SERVICE_URL : 'MISSING',
);
console.log(
  'URL_SERVICE_URL (from process.env in env.ts):',
  process.env.URL_SERVICE_URL ? process.env.URL_SERVICE_URL : 'MISSING',
);
console.log('--- END ENV DEBUG (from env.ts - from process.env) ---');

export const envSchema = z.object({
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  MONGO_URI: z.string().url(),
  // Ensure these are OPTIONAL if they might not be present in ALL environments (e.g., local .env)
  // If they are REQUIRED for the app to function on Render, they MUST be present there.
  AUTH_SERVICE_URL: z.string().url(), // Keep as REQUIRED if they must always be there
  URL_SERVICE_URL: z.string().url(), // Keep as REQUIRED if they must always be there
});

// Parse process.env against the schema to validate and get typed environment variables
export const env = envSchema.parse(process.env); // This line will now correctly parse what Render provides

console.log('--- ENV DEBUG (after validation) ---');
console.log('GOOGLE_CLIENT_ID (validated):', env.GOOGLE_CLIENT_ID ? 'Loaded' : 'MISSING');
console.log('GOOGLE_CLIENT_SECRET (validated):', env.GOOGLE_CLIENT_SECRET ? 'Loaded' : 'MISSING');
console.log('MONGO_URI (validated):', env.MONGO_URI ? 'Loaded' : 'MISSING');
console.log(
  'AUTH_SERVICE_URL (validated):',
  env.AUTH_SERVICE_URL ? 'Loaded auth_service_url' : "Couldn't load auth_service_url",
);
console.log(
  'URL_SERVICE_URL (validated):',
  env.URL_SERVICE_URL ? 'Loaded url_service_url' : "Couldn't load url_service_url",
);
console.log('--- END ENV DEBUG (after validation) ---');
