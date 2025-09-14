const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().url('Invalid database URL'),
  SLACK_CLIENT_ID: z.string().min(1, 'Slack client ID is required'),
  SLACK_CLIENT_SECRET: z.string().min(1, 'Slack client secret is required'),
  SLACK_REDIRECT_URI: z.string().url('Invalid Slack redirect URI'),
  FRONTEND_URL: z.string().url('Invalid frontend URL'),
  ALLOWED_ORIGINS: z.string(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters'),
});

try {
  envSchema.parse(process.env);
  console.log('✅ Environment validation passed');
} catch (error) {
  console.error('❌ Environment validation failed:');
  error.errors.forEach(err => {
    console.error(`  - ${err.path.join('.')}: ${err.message}`);
  });
  process.exit(1);
}
