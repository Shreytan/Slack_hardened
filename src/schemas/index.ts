import { z } from 'zod';

// Environment validation schema
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('8000').transform(Number),
  DATABASE_URL: z.string().default('sqlite:data/slack_connect.db'),
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  SLACK_REDIRECT_URI: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000').transform(s => s.split(',')),
  ENCRYPTION_KEY: z.string().optional(),
  LOG_LEVEL: z.string().default('info'),
});

export const validateEnv = () => {
  return envSchema.parse(process.env);
};

// Request validation schemas
export const authStatusParamsSchema = z.object({
  userId: z.string().min(1)
});

export const oauthCallbackQuerySchema = z.object({
  code: z.string().optional(),
  error: z.string().optional(),
  state: z.string().optional()
});

export const channelsParamsSchema = z.object({
  userId: z.string().min(1)
});

export const sendMessageSchema = z.object({
  userId: z.string().min(1),
  channelId: z.string().min(1),
  message: z.string().min(1).max(4000)
});

export const scheduleMessageSchema = z.object({
  userId: z.string().min(1),
  channelId: z.string().min(1),
  message: z.string().min(1).max(4000),
  scheduledTime: z.string().datetime()
});

export const scheduledMessagesParamsSchema = z.object({
  userId: z.string().min(1)
});

export const scheduledMessagesQuerySchema = z.object({
  status: z.enum(['all', 'pending', 'sent', 'failed', 'cancelled']).default('all'),
  limit: z.string().default('10').transform(Number),
  offset: z.string().default('0').transform(Number)
});

export const cancelMessageParamsSchema = z.object({
  messageId: z.string().min(1)
});
