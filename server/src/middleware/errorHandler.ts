import { Request, Response, NextFunction } from 'express';

/**
 * Global Error Handler
 * Catches any unhandled errors from routes/middleware and returns clean JSON.
 * Must be registered LAST in the middleware chain (after all routes).
 * 
 * What it does:
 * 1. Logs the full error to server console (for debugging)
 * 2. Returns a clean JSON error to the client (no stack traces exposed)
 * 3. Handles known error types with appropriate status codes
 */
export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log full error details to server console
  console.error(`[Error] ${req.method} ${req.path}:`, err.message || err);

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Known error types
  if (err.code === 'P2002') {
    // Prisma unique constraint violation
    return res.status(409).json({
      error: 'A record with this data already exists',
    });
  }

  if (err.code === 'P2025') {
    // Prisma record not found
    return res.status(404).json({
      error: 'Record not found',
    });
  }

  if (err.type === 'entity.parse.failed') {
    // Invalid JSON in request body
    return res.status(400).json({
      error: 'Invalid JSON in request body',
    });
  }

  // Generic error response
  res.status(statusCode).json({
    error: statusCode === 500
      ? 'Internal server error'  // Don't expose internal details
      : err.message || 'Something went wrong',
  });
}

/**
 * 404 Handler
 * Catches requests to routes that don't exist.
 * Must be registered AFTER all routes but BEFORE the error handler.
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
  });
}
