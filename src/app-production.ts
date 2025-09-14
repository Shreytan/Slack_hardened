import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

dotenv.config();

import { connectDatabase } from './config/database';
import { validateEnv } from './schemas/index';
import { logger, logHelpers } from './logger';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler';
import { securityMiddleware, requestSanitizer } from './middleware/security';
import { apiLimiter, authLimiter, messageLimiter } from './middleware/rateLimiter';
import { httpMetricsMiddleware, metricsHandler } from './metrics';
import { healthCheck, readinessCheck, livenessCheck } from './health';

let config;
try {
  config = validateEnv();
  logger.info('Environment validation passed', { 
    nodeEnv: config.NODE_ENV,
    port: config.PORT 
  });
} catch (error: any) {
  logger.error('Environment validation failed', { error: error.message });
  process.exit(1);
}

const app = express();

// Security middleware
app.use(securityMiddleware);
if (config.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestSanitizer);

// CORS
app.use(cors({
  origin: config.ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));

// Logging
app.use(morgan('combined', { 
  stream: { write: (message) => logger.http(message.trim()) },
  skip: (req) => {
    if (config.NODE_ENV === 'production') {
      return req.url.includes('/health') || req.url.includes('/metrics');
    }
    return false;
  }
}));

// Metrics
app.use(httpMetricsMiddleware);

// Health endpoints (before rate limiting)
app.get('/health', asyncHandler(healthCheck));
app.get('/ready', asyncHandler(readinessCheck)); 
app.get('/alive', livenessCheck);
app.get('/metrics', metricsHandler);

// Rate limiting
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/slack/send-message', messageLimiter);
app.use('/api/slack/schedule-message', messageLimiter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Slack Connect API',
    version: '2.0.0',
    status: 'running',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    features: {
      security: true,
      rateLimiting: 'memory-store',
      healthChecks: true,
      metrics: true,
      encryption: true,
      database: 'sqlite',
      logging: 'structured'
    }
  });
});

// Test endpoint
if (config.NODE_ENV !== 'production') {
  app.get('/api/test', (req, res) => {
    res.json({
      message: 'Backend running with full production hardening!',
      environment: config.NODE_ENV,
      timestamp: new Date().toISOString(),
      config: {
        port: config.PORT,
        hasEncryptionKey: !!config.ENCRYPTION_KEY,
        hasSlackCredentials: !!(config.SLACK_CLIENT_ID && config.SLACK_CLIENT_SECRET),
        rateLimiting: 'active',
        security: 'enabled',
        metrics: 'collecting',
        logging: 'structured'
      }
    });
  });
}

const startServer = async () => {
  try {
    console.log('í´„ Connecting to database...');
    await connectDatabase();
    
    console.log('í´„ Loading models...');
    await import('./models/User');
    await import('./models/ScheduledMessage');
    
    console.log('í´„ Loading routes...');
    const authRoutes = (await import('./routes/auth')).default;
    const slackRoutes = (await import('./routes/slack')).default;
    
    app.use('/api/auth', authRoutes);
    app.use('/api/slack', slackRoutes);
    
    console.log('âœ… All systems loaded successfully');
    
    // Error handlers MUST be last
    app.use(notFoundHandler);
    app.use(errorHandler);
    
    const server = app.listen(config.PORT, () => {
      logger.info('Server started successfully', {
        port: config.PORT,
        environment: config.NODE_ENV,
        features: ['security', 'rate-limiting', 'metrics', 'logging', 'health-checks']
      });
      
      console.log(`íº€ Production server running on port ${config.PORT}`);
      console.log(`í³Š Health: http://localhost:${config.PORT}/health`);
      console.log(`í³ˆ Metrics: http://localhost:${config.PORT}/metrics`);
      console.log(`í´ OAuth: http://localhost:${config.PORT}/api/auth/connect`);
      console.log('âœ… Production hardening complete!');
    });
    
    server.timeout = 30000;
    
    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown...`);
      try {
        server.close(() => {
          logger.info('Server closed successfully');
          process.exit(0);
        });
      } catch (error) {
        logger.error('Error during graceful shutdown', { error });
        process.exit(1);
      }
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error: any) {
    logger.error('Failed to start server', { 
      error: error.message,
      stack: error.stack 
    });
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

export default app;
