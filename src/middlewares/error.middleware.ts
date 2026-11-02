import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `API Route Not Found - [${req.method}] ${req.originalUrl}`,
  });
}

export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('🔥 Server Error:', err);

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: err.issues[0]?.message || 'Input validation failed',
      errors: err.flatten().fieldErrors,
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A duplicate record already exists with this data',
    });
  }

  // Fallback internal error
  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}