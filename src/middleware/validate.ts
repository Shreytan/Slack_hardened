import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createValidationError } from './errorHandler';
import { logHelpers } from '../logger';

export const validate = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logHelpers.security('Validation error', {
          path: req.path,
          method: req.method,
          errors: error.errors,
        });

        const validationError = createValidationError(
          'Input validation failed',
          error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code,
          }))
        );

        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

export const validateBody = (schema: ZodSchema) => validate({ body: schema });
export const validateQuery = (schema: ZodSchema) => validate({ query: schema });
export const validateParams = (schema: ZodSchema) => validate({ params: schema });

// Safe sanitization middleware that doesn't modify read-only properties
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeObject = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;

    // Create a new object instead of modifying the original
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip dangerous keys
      if (typeof key === 'string' && (
        key.startsWith('__') ||
        key.includes('prototype') ||
        key.includes('constructor')
      )) {
        continue;
      }
      
      // Recursively sanitize nested objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  };

  try {
    // Only sanitize req.body (which is typically writable)
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
  } catch (error) {
    // If sanitization fails, just continue without crashing
    console.warn('Request sanitization warning:', error);
  }
  
  next();
};
