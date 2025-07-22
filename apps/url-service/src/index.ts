import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { connectDB } from '@repo/db';
import {
  errorHandler,
  logger,
  metricsMiddleware,
  metricsHandler,
  catchExitSignals,
} from '@repo/utils';
import urlRoutes from './routes/urlRoutes';
import swaggerSpec from './swagger';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs'; // Ensure fs is imported

// Function to find the monorepo root (where package.json and .env usually reside)
function findMonorepoRoot(startDir: string): string | null {
  let currentDir = startDir;
  // Loop until we reach the drive root (e.g., C:\ on Windows, / on Linux/macOS)
  while (currentDir !== path.parse(currentDir).root) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    const envPath = path.join(currentDir, '.env');
    // Check if both package.json and .env exist in the current directory
    if (fs.existsSync(packageJsonPath) && fs.existsSync(envPath)) {
      return currentDir;
    }
    // Move up to the parent directory
    currentDir = path.dirname(currentDir);
  }
  return null; // Return null if root is not found
}

// Determine the root of the monorepo. Using `process.cwd()` is often more reliable
// as it reflects the directory from which the Node.js/Bun process was started.
const startDirForEnv = process.cwd();
const monorepoRoot = findMonorepoRoot(startDirForEnv);

if (monorepoRoot) {
  const envPath = path.join(monorepoRoot, '.env');
  dotenv.config({ path: envPath });
  console.log('--- ENV DEBUG ---');
  console.log('Monorepo Root Found:', monorepoRoot);
  console.log('Attempting to load .env from:', envPath);
} else {
  console.warn('--- ENV DEBUG ---');
  console.warn('Could not find monorepo root. Falling back to default .env loading (CWD).');
  dotenv.config(); // Fallback
}

// Add these debug logs to verify after dotenv.config()
console.log(
  'GOOGLE_CLIENT_ID (after load):',
  process.env.GOOGLE_CLIENT_ID
    ? 'Loaded (starts with ' + process.env.GOOGLE_CLIENT_ID.substring(0, 5) + '...)'
    : 'NOT Loaded',
);
console.log(
  'GOOGLE_CLIENT_SECRET (after load):',
  process.env.GOOGLE_CLIENT_SECRET ? 'Loaded' : 'NOT Loaded',
);
console.log('MONGO_URI (after load):', process.env.MONGO_URI ? 'Loaded' : 'NOT Loaded');
console.log('REDIS_URL (after load):', process.env.REDIS_URL ? 'Loaded' : 'NOT Loaded');
console.log('REDIS_HOST (after load):', process.env.REDIS_HOST ? 'Loaded' : 'NOT Loaded');
console.log('REDIS_PASSWORD (after load):', process.env.REDIS_PASSWORD ? 'Loaded' : 'NOT Loaded');
console.log('--- END ENV DEBUG ---');

const app = express();
const PORT = process.env.URL_SERVICE_PORT || 5002;
const MONGO_URI = process.env.MONGO_URI!;

// Connect to MongoDB
connectDB(MONGO_URI, 'url_service_db');

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(metricsMiddleware);

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/', urlRoutes);

// Health Check
app.get('/health', (req, res) => res.status(200).send('URL Service is healthy!'));
app.get('/metrics', metricsHandler);

// Error Handling
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`URL Service running on http://localhost:${PORT}`);
});

// Graceful shutdown
catchExitSignals(server);
