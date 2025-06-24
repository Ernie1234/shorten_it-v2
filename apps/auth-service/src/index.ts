import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import passport from 'passport';
import { connectDB } from '@repo/db';
import {
  errorHandler,
  logger,
  metricsMiddleware,
  metricsHandler,
  catchExitSignals,
} from '@repo/utils';
import authRoutes from './routes/authRoutes';
import path from 'path';
import fs from 'fs';

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

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 5001;
const MONGO_URI = process.env.MONGO_URI!;

// Connect to MongoDB
connectDB(MONGO_URI, 'auth_service_db');

// Middleware
app.use(express.json());

app.use((req, res, next) => {
  // Only apply this debug for specific POST routes
  if (req.method === 'POST' && (req.originalUrl === '/register' || req.originalUrl === '/login')) {
    logger.info(`[DEBUG REQ BODY (after express.json)] for ${req.originalUrl}:`, req.body);
    logger.info(`[DEBUG REQ HEADER] Content-Type:`, req.headers['content-type']);

    // Additionally, try to read the raw body stream if req.body is empty.
    // This part should technically run *before* express.json() if we wanted to
    // see the *raw* stream for debugging, but placing it after
    // allows us to see if express.json() consumed it or if it was empty.
    // NOTE: This might not work reliably if express.json() has already consumed the stream.
    if (
      Object.keys(req.body).length === 0 &&
      req.headers['content-type']?.includes('application/json')
    ) {
      let rawBody = '';
      req.on('data', (chunk) => {
        rawBody += chunk.toString();
      });
      req.on('end', () => {
        logger.warn(
          `[DEBUG RAW BODY STREAM] Raw body for ${req.originalUrl} (if express.json failed):`,
          rawBody,
        );
      });
    }
  }
  next();
});

app.use(
  cors({
    origin: [process.env.WEB_APP_URL!, process.env.MOBILE_APP_URL!].filter(Boolean), // Allow specific origins
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan('dev'));
app.use(metricsMiddleware); // Prometheus metrics

// Passport initialization
app.use(passport.initialize());

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/', authRoutes);

// Health Check
app.get('/health', (req, res) => res.status(200).send('Auth Service is healthy!'));
app.get('/metrics', metricsHandler); // Prometheus metrics endpoint

// Error Handling Middleware (must be last)
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`👱 Auth Service running on http://localhost:${PORT}`);
});

// Graceful shutdown
catchExitSignals(server);
