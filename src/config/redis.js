import Redis from 'ioredis';
import { logger } from '../middleware/logger.js'; // Assuming you have a logger setup

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
});

redis.on('connect', () => {
    logger.info('Connected to Redis successfully');
});

redis.on('error', (err) => {
    logger.error(`Redis Error: ${err.message}`);
});

export default redis;
