import winston from 'winston';

const level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info: winston.Logform.TransformableInfo) => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

export const logger = winston.createLogger({
  level,
  format: devFormat,
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

export const logHelpers = {
  auth: (message: string, meta?: any) => logger.info(message, { component: 'auth', ...meta }),
  slack: (message: string, meta?: any) => logger.info(message, { component: 'slack', ...meta }),
  security: (message: string, meta?: any) => logger.warn(message, { component: 'security', ...meta }),
  db: (message: string, meta?: any) => logger.info(message, { component: 'database', ...meta }),
  queue: (message: string, meta?: any) => logger.info(message, { component: 'queue', ...meta }),
  error: (error: Error, context?: string, meta?: any) => {
    logger.error(`${context || 'Error occurred'}: ${error.message}`, { error: error.message, ...meta });
  },
};
