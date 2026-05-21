import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const envSchema = z.object({
  PORT: z.string().default('3000'),
  
  DATABASE_URL: z.string().url(),
  MONGO_URI: z.string(),
  REDIS_URL: z.string(),
  
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
