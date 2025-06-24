import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@repo/types';

// Custom Error class
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Centralized error handling middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction, // _next is unused but required for Express error middleware signature
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose CastError (e.g., invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle Mongoose Duplicate Key Error (e.g., unique constraint violation)
  if (err.code === 11000) {
    statusCode = 409; // Conflict
    const field = Object.keys(err.keyValue).join(', ');
    message = `Duplicate field value: ${field}. Please use another value.`;
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = err.errors.map((e: any) => e.message).join(', ');
  }

  // For non-operational errors, log them but send a generic message
  if (!err.isOperational && statusCode === 500) {
    console.error('Non-operational error:', err); // Log details for debugging
    message = 'Something went wrong. Please try again later.';
  }

  const response: ApiResponse<null> = {
    success: false,
    statusCode,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Include stack in dev
  };

  res.status(statusCode).json(response);
};

// Catch unhandled promise rejections and uncaught exceptions
export const catchExitSignals = (server: any) => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    // Changed type from PromiseRejectionEvent to any
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // You might want to gracefully shut down the server here
    server.close(() => {
      process.exit(1);
    });
  });

  process.on('uncaughtException', (err: Error) => {
    console.error('Uncaught Exception:', err);
    server.close(() => {
      process.exit(1);
    });
  });
};
