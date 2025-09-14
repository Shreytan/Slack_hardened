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
  console.error('Environment validation failed:', error.message);
  process.exit(1);
}

const app = express();

// Security
app.use(securityMiddleware);

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestSanitizer);

// CORS
app.use(cors({
  origin: config.ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Logging
app.use(morgan('combined', { 
  stream: { write: (message: string) => logger.http(message.trim()) },
  skip: (req: express.Request) => req.url.includes('/health') || req.url.includes('/metrics')
}));

// Metrics
app.use(httpMetricsMiddleware);

// Health endpoints
app.get('/health', asyncHandler(healthCheck));
app.get('/ready', asyncHandler(readinessCheck)); 
app.get('/alive', livenessCheck);
app.get('/metrics', metricsHandler);

// Rate limiting
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/slack/send-message', messageLimiter);

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
      rateLimiting: true,
      healthChecks: true,
      metrics: true,
      encryption: true,
      database: true,
      logging: true
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
    console.log('Ì¥Ñ Connecting to database...');
    await connectDatabase();
    
    console.log('Ì¥Ñ Loading models...');
    await import('./models/User');
    await import('./models/ScheduledMessage');
    
    console.log('Ì¥Ñ Loading routes...');
    const { default: authRoutes } = await import('./routes/auth');
    const { default: slackRoutes } = await import('./routes/slack');
    
    app.use('/api/auth', authRoutes);
    app.use('/api/slack', slackRoutes);
    
    console.log('‚úÖ All systems loaded successfully');
    
    // Error handlers MUST be last
    app.use(notFoundHandler);
    app.use(errorHandler);
    
    const server = app.listen(config.PORT, () => {
      logger.info('Server started successfully', {
        port: config.PORT,
        environment: config.NODE_ENV,
        features: ['security', 'rate-limiting', 'metrics', 'logging', 'health-checks']
      });
      
      console.log(`Ì∫Ä Production server running on port ${config.PORT}`);
      console.log(`Ì≥ä Health: http://localhost:${config.PORT}/health`);
      console.log(`Ì≥à Metrics: http://localhost:${config.PORT}/metrics`);
      console.log(`Ì¥ê OAuth: http://localhost:${config.PORT}/api/auth/connect`);
      console.log(`Ì∑™ Test: http://localhost:${config.PORT}/api/test`);
      console.log('‚úÖ Production hardening complete!');
    });
    
    server.timeout = 30000;
    
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => process.exit(0));
    });
    
  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message });
    console.error('‚ùå Failed to start server:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

export default app;
