import client, { Counter, Histogram, Registry } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

export const register = new Registry();

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds', 
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const messagesSentTotal = new Counter({
  name: 'messages_sent_total',
  help: 'Total number of messages sent successfully',
  registers: [register],
});

client.collectDefaultMetrics({ register });

export const metricsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    res.set('Content-Type', register.contentType);
    const metricsData = await register.metrics();
    res.end(metricsData);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
};

export const httpMetricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const route = req.route?.path || req.path || 'unknown';
    
    const labels = { 
      method: req.method.toUpperCase(), 
      route, 
      status_code: res.statusCode.toString() 
    };
    
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration / 1000);
  });
  
  next();
};

export class MetricsHelper {
  static recordMessageProcessed(success: boolean): void {
    if (success) {
      messagesSentTotal.inc();
    }
  }
}
