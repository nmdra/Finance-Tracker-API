import axios from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from '../middleware/logger.js';

const createAxiosInstance = (retries = 3, timeout = 10000) => {
    const instance = axios.create({
        timeout: timeout,
    });

    // Set up axios-retry
    axiosRetry(instance, {
        retries: retries,
        retryDelay: (retryCount) => {
            logger.warn(`Retrying request... Attempt #${retryCount}`);
            return retryCount * 1000; // Exponential backoff: 1s, 2s, 3s
        },
        retryCondition: (error) => {
            return (
                error.isAxiosError &&
                (error.response?.status === 500 || error.code === 'ETIMEDOUT')
            ); // Retry on specific conditions
        },
    });

    return instance;
};

export { createAxiosInstance };
