import { createClient } from 'redis';
import logger from '../utils/logger.js';

const redisClient = createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

export async function connectRedis() {
    try {
        await redisClient.connect();
        logger.info('Redis connection established');
    } catch (error) {
        logger.error('Failed to connect to Redis:', error);
        throw error;
    }
}

export default redisClient;

