import { Pool } from 'pg';
import { env } from './env';
import { logger } from '../utils/logger';

export const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
});

pgPool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pgPool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});
