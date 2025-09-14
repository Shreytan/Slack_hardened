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
        // Cast to any to avoid Express type conflicts
        (req as any).query = schema.query.parse(req.query);
      }

      if (schema.params) {
        // Cast to any to avoid Express type conflicts
        (req as any).params = schema.params.parse(req.params);
      }

      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        // Zod v4+ uses 'issues' instead of 'errors'
        const errorIssues = error.issues || (error as any).errors || [];
        
        logHelpers.security('Validation error', {
          path: req.path,
          method: req.method,
          errors: errorIssues,
        });

        const validationError = createValidationError(
          'Input validation failed',
          errorIssues.map((err: any) => ({
            path: Array.isArray(err.path) ? err.path.join('.') : String(err.path || ''),
            message: err.message || 'Validation failed',
            code: err.code || 'validation_error',
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

export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeObject = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof key === 'string' && (
        key.startsWith('__') ||
        key.includes('prototype') ||
        key.includes('constructor')
      )) {
        continue;
      }
      
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  };

  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
  } catch (error) {
    console.warn('Request sanitization warning:', error);
  }
  
  next();
};
