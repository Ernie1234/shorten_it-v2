// apps/api-gateway/index.ts

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import proxy from 'express-http-proxy';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit'; // Import express-rate-limit

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

// Function to find the monorepo root (keep as is)
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

const startDir = process.cwd();
const monorepoRoot = findMonorepoRoot(startDir);

if (monorepoRoot) {
  const envPath = path.join(monorepoRoot, '.env');
  dotenv.config({ path: envPath, override: false });
  console.log('--- API GATEWAY ENV DEBUG ---');
  console.log('Monorepo Root Found:', monorepoRoot);
  console.log('Attempting to load .env from:', envPath);
} else {
  console.warn('--- API GATEWAY ENV DEBUG ---');
  console.warn('Could not find monorepo root. Loading .env from default location (CWD).');
  dotenv.config();
}

console.log(
  'GOOGLE_CLIENT_ID (after API GATEWAY load):',
  process.env.GOOGLE_CLIENT_ID
    ? 'Loaded (starts with ' + process.env.GOOGLE_CLIENT_ID.substring(0, 5) + '...)'
    : 'NOT Loaded',
);
console.log(
  'GOOGLE_CLIENT_SECRET (after API GATEWAY load):',
  process.env.GOOGLE_CLIENT_SECRET ? 'Loaded' : 'NOT Loaded',
);
console.log('MONGO_URI (after API GATEWAY load):', process.env.MONGO_URI ? 'Loaded' : 'NOT Loaded');
console.log(
  'AUTH_SERVICE_URL (after API GATEWAY load):',
  process.env.AUTH_SERVICE_URL ? 'Loaded' : 'NOT Loaded',
);
console.log('--- END API GATEWAY ENV DEBUG ---');
if (process.env.NODE_ENV !== 'production') {
  dotenv.config(); // Loads .env from CWD if not in production
}

import {
  errorHandler,
  logger,
  // rateLimitMiddleware, // Removed as it's now handled by express-rate-limit
  metricsMiddleware,
  metricsHandler,
  catchExitSignals,
  ApiError,
} from '@repo/utils';
import { authenticateToken } from './middleware/authMiddleware';
import swaggerSpec from './swagger';

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 5000;

// Set trust proxy to 1 for correct IP detection behind proxies/load balancers
app.set('trust proxy', 1);

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true })); // Added for URL-encoded bodies
app.use(
  cors({
    origin: [process.env.WEB_APP_URL!, process.env.MOBILE_APP_URL!].filter(Boolean),
    credentials: true,
  }),
);
app.use(helmet());
app.use(
  morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
  }),
);
app.use(metricsMiddleware);

// --- NEW: express-rate-limit configuration ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => (req.user ? 1000 : 100), // 1000 requests for authenticated, 100 for unauthenticated
  message: { success: false, message: 'Too many requests, please try again later!' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req: Request) => req.ip || 'unknown-ip',
});
app.use(apiLimiter);
app.use(authenticateToken);

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Auth Service Proxy - Strip /api/auth prefix before forwarding
app.use('/api/auth', proxy(process.env.AUTH_SERVICE_URL || 'http://localhost:5001'));

// URL Service Proxy - Strip /api/urls prefix before forwarding
// app.use('/api/urls', proxy(process.env.URL_SERVICE_URL || 'http://localhost:5002'));
// URL Service Proxy - Strip /api/urls prefix before forwarding
app.use(
  '/api/urls',
  proxy(process.env.URL_SERVICE_URL || 'http://localhost:5002', {
    proxyReqPathResolver: (req) => {
      return req.url; // Use original URL path relative to '/api/urls'
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      // If user is authenticated in the gateway, pass user ID to the service
      if (srcReq.user && srcReq.user.id) {
        proxyReqOpts.headers = {
          ...proxyReqOpts.headers,
          'X-User-Id': srcReq.user.id,
          'X-User-Email': srcReq.user.email,
        };
        logger.debug(`[API Gateway] Forwarding request with X-User-Id: ${srcReq.user.id}`);
      } else {
        logger.debug('[API Gateway] Forwarding unauthenticated request to URL Service.');
      }
      return proxyReqOpts;
    },
  }),
);
// Health endpoints
app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('API Gateway is healthy!');
});

app.get('/metrics', metricsHandler);

// Error handling
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`API Gateway running on http://localhost:${PORT}`);
});

catchExitSignals(server);
