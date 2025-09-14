import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { connectDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Slack Connect API',
    version: '2.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    features: ['basic-api', 'database', 'error-handling']
  });
});

// Enhanced health check with database
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await import('./config/database').then(db => db.sequelize.authenticate());
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'disconnected',
      error: error.message
    });
  }
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend API is working with database!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    port: PORT,
    hasEncryptionKey: !!process.env.ENCRYPTION_KEY
  });
});

const startServer = async () => {
  try {
    console.log('Ì¥Ñ Connecting to database...');
    await connectDatabase();
    
    console.log('Ì¥Ñ Loading models...');
    await import('./models/User');
    await import('./models/ScheduledMessage');
    
    console.log('Ì¥Ñ Loading routes...');
    const authRoutes = (await import('./routes/auth')).default;
    const slackRoutes = (await import('./routes/slack')).default;
    
    app.use('/api/auth', authRoutes);
    app.use('/api/slack', slackRoutes);
    
    console.log('‚úÖ Database and routes loaded successfully');
    
    app.use(notFoundHandler);
    app.use(errorHandler);
    
    const server = app.listen(PORT, () => {
      console.log(`Ì∫Ä Server with database running on port ${PORT}`);
      console.log(`Ì≥ä Health: http://localhost:${PORT}/health`);
      console.log(`Ì∑™ Test: http://localhost:${PORT}/api/test`);
      console.log('‚úÖ All systems operational with database!');
    });
    
  } catch (error: any) {
    console.error('‚ùå Failed to start server:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

export default app;
