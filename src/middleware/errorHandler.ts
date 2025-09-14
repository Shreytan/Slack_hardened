import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'sequelize';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createValidationError = (message: string, details?: any) =>
  new CustomError(message, 400, 'VALIDATION_ERROR', true);

export const createNotFoundError = (resource: string) =>
  new CustomError(`${resource} not found`, 404, 'NOT_FOUND', true);

export const createUnauthorizedError = (message: string = 'Unauthorized') =>
  new CustomError(message, 401, 'UNAUTHORIZED', true);

const normalizeError = (error: any): AppError => {
  if (error instanceof ZodError) {
    // Zod v4+ uses 'issues' instead of 'errors'
    const errorDetails = error.issues || (error as any).errors || [];
    return createValidationError('Input validation failed', errorDetails);
  }
  
  if (error instanceof ValidationError) {
    return createValidationError('Database validation failed');
  }
  
  if (error && typeof error === 'object' && error.statusCode && error.code) {
    return error;
  }
  
  return new CustomError(
    error?.message || 'Internal server error',
    error?.statusCode || 500,
    error?.code || 'INTERNAL_ERROR',
    false
  );
};

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    return next(error);
  }

  const normalizedError = normalizeError(error);
  
  try {
    console.error('Server error:', {
      message: normalizedError.message,
      code: normalizedError.code,
      url: req?.url || 'unknown',
      method: req?.method || 'unknown',
      timestamp: new Date().toISOString()
    });
  } catch (logError) {
    console.error('Error logging failed:', logError);
  }

  const response = {
    error: normalizedError.message,
    code: normalizedError.code,
    statusCode: normalizedError.statusCode,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development' && normalizedError.stack) {
    (response as any).stack = normalizedError.stack;
  }

  res.status(normalizedError.statusCode || 500).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
    statusCode: 404,
    timestamp: new Date().toISOString()
  });
};
