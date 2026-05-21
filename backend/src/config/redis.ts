import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

// Main client for caching, session, geo operations
export const redisClient = new Redis(env.REDIS_URL);

// Separate clients required for pub/sub because once a client subscribes, 
// it cannot issue other commands.
export const redisPublisher = new Redis(env.REDIS_URL);
export const redisSubscriber = new Redis(env.REDIS_URL);

redisClient.on('connect', () => logger.info('Connected to Redis'));
redisClient.on('error', (err) => logger.error('Redis error:', err));
