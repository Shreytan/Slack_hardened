import { Request, Response } from 'express';
import { sequelize } from './config/database';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      message: string;
    };
  };
}

async function checkDatabase() {
  const startTime = Date.now();
  try {
    await sequelize.authenticate();
    await sequelize.query('SELECT 1 as health_check');
    return {
      status: 'healthy' as const,
      responseTime: Date.now() - startTime,
      message: 'Database connection is healthy'
    };
  } catch (error: any) {
    return {
      status: 'unhealthy' as const,
      responseTime: Date.now() - startTime,
      message: 'Database connection failed'
    };
  }
}

export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const dbCheck = await checkDatabase();
    const health: HealthStatus = {
      status: dbCheck.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.0.0',
      checks: { database: dbCheck }
    };
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
};

export const readinessCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'not-ready',
      timestamp: new Date().toISOString()
    });
  }
};

export const livenessCheck = (req: Request, res: Response): void => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid
  });
};
