import client from 'prom-client'; // npm install prom-client
import type { Request, Response, NextFunction } from 'express';
import logger from './logger';

// Register default metrics (Node.js process, CPU, memory, etc.)
client.collectDefaultMetrics();

// Custom Metric: HTTP Request Counter
export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Custom Metric: HTTP Request Duration Histogram
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 1.5, 2, 5], // Buckets for response time (seconds)
});

// Middleware to collect metrics
// Middleware to collect metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const end = httpRequestDurationSeconds.startTimer();
  res.on('finish', () => {
    // Correcting the type for the route label
    const routePath = (req.route?.path || req.path) as string;

    httpRequestCounter.inc({
      method: req.method,
      route: routePath,
      status_code: res.statusCode,
    });
    end({
      method: req.method,
      route: routePath,
      status_code: res.statusCode,
    });
  });
  next();
};

// Expose metrics endpoint
export const metricsHandler = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (error) {
    logger.error('Error fetching Prometheus metrics:', error);
    res.status(500).send('Error fetching metrics');
  }
};

//  * *Note*: Remember to `bun add prom-client` to your backend services that use this.
