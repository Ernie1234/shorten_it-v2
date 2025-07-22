import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import fs from 'fs';

// --- START: Environment Variable Loading Logic (MODIFIED) ---
// This block will only attempt to load .env files if not in a production environment.
// On Render, process.env variables are already available.
if (process.env.NODE_ENV !== 'production') {
  // Function to find the monorepo root (where package.json and .env usually reside)
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
    dotenv.config({ path: envPath });
    console.log('--- ENV DEBUG (from env.ts - Local .env loaded) ---');
    console.log('Monorepo Root Found:', monorepoRoot);
    console.log('Attempting to load .env from:', envPath);
  } else {
    console.warn('--- ENV DEBUG (from env.ts - Local .env fallback) ---');
    console.warn('Could not find monorepo root. Falling back to default .env loading (CWD).');
    dotenv.config();
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
); // Add this for utils
console.log(
  'URL_SERVICE_URL (from process.env in env.ts):',
  process.env.URL_SERVICE_URL ? process.env.URL_SERVICE_URL : 'MISSING',
); // Add this for utils
console.log('--- END ENV DEBUG (from env.ts - from process.env) ---');

export const envSchema = z.object({
  // Define all required env vars
  // Removed REDIS_HOST, REDIS_PORT, REDIS_PASSWORD as Redis is removed
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  MONGO_URI: z.string().url(),
});

// Parse process.env against the schema to validate and get typed environment variables
export const env = envSchema.parse(process.env);

console.log('--- ENV DEBUG (after validation) ---');
console.log('GOOGLE_CLIENT_ID (validated):', env.GOOGLE_CLIENT_ID ? 'Loaded' : 'MISSING');
console.log('GOOGLE_CLIENT_SECRET (validated):', env.GOOGLE_CLIENT_SECRET ? 'Loaded' : 'MISSING');
console.log('MONGO_URI (validated):', env.MONGO_URI ? 'Loaded' : 'MISSING');
console.log('--- END ENV DEBUG (after validation) ---');
