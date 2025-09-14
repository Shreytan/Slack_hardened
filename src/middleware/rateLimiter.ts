import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const createLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too Many Requests',
      message,
      type: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      console.log(`Rate limit exceeded: ${req.ip} ${req.method} ${req.url}`);
      res.status(429).json({
        error: 'Too Many Requests',
        message,
        type: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

export const apiLimiter = createLimiter(15 * 60 * 1000, 100, 'API rate limit exceeded.');
export const authLimiter = createLimiter(1 * 60 * 1000, 5, 'Auth rate limit exceeded.');
export const messageLimiter = createLimiter(1 * 60 * 1000, 20, 'Message rate limit exceeded.');
