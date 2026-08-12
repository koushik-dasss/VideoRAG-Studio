import IORedis from 'ioredis';
import { createLogger } from './logger';

const logger = createLogger('RedisFactory');

export function getBullMqConnectionOptions(redisUrl?: string) {
  const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
  const connection = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
    connectTimeout: 5000,
    retryStrategy: (times) => {
      return Math.min(times * 200, 3000);
    }
  });

  connection.on('error', (err) => {
    logger.warn(`Redis connection event: ${err.message}`);
  });

  return { connection: connection as any };
}

export function getRedisClient(redisUrl?: string) {
  const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
  const client = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
    connectTimeout: 5000,
    retryStrategy: (times) => {
      return Math.min(times * 200, 3000);
    }
  });

  client.on('error', (err) => {
    logger.warn(`Redis client event: ${err.message}`);
  });

  return client;
}
