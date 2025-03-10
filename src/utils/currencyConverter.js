import redis from '../config/redis.js';
import { createAxiosInstance } from './axiosRetry.js';
import { logger } from '../middleware/logger.js';

const axiosInstance = createAxiosInstance(3, 5000);
const CACHE_EXPIRATION = 36000;
const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const BASE_CURRENCY = process.env.BASE_CURRENCY;

export const convertCurrency = async (
    amount,
    fromCurrency,
    toCurrency = BASE_CURRENCY
) => {
    try {
        if (!API_KEY) throw new Error('Exchange Rate API key is missing');
        if (!fromCurrency || !toCurrency)
            throw new Error('Invalid currency codes provided');
        if (fromCurrency === toCurrency) return amount.toFixed(2); // No conversion needed

        logger.info(
            `Fetching exchange rate for ${fromCurrency} to ${toCurrency}`
        );

        const cacheKey = `exchange_rate:${fromCurrency}:${toCurrency}`;

        const cachedRate = await redis.get(cacheKey);
        if (cachedRate) {
            logger.info(
                `Using cached exchange rate for ${fromCurrency} to ${toCurrency}`
            );
            const convertedAmount = amount * parseFloat(cachedRate);
            return convertedAmount.toFixed(2);
        }

        let response;
        try {
            response = await axiosInstance.get(
                `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${fromCurrency}/${toCurrency}`
            );
        } catch (error) {
            if (error.response) {
                logger.error(`API Error: ${error.response.data}`);
                handleApiError(error.response.data); // Handle API specific errors
            }
            // Log general Axios errors
            if (error.isAxiosError) {
                logger.error(`Axios error: ${error.message}`);
            } else {
                logger.error(`Error: ${error.message}`);
            }
            throw error; // Rethrow the error to handle it in the outer catch
        }

        // Check for API success
        if (response.data.result !== 'success') handleApiError(response.data);

        const rates = response.data.conversion_rate;
        if (!rates) {
            throw new Error(`Exchange rate for ${toCurrency} not available`);
        }

        await redis.setex(cacheKey, CACHE_EXPIRATION, rates.toString());

        const convertedAmount = amount * rates;
        logger.info(
            `Converted ${amount} ${fromCurrency} to ${convertedAmount.toFixed(2)} ${toCurrency}`
        );

        return convertedAmount.toFixed(2);
    } catch (error) {
        throw new Error(`Currency conversion failed: ${error.message}`);
    }
};

// Handle API Errors
const handleApiError = (errorData) => {
    const { result, 'error-type': errorType } = errorData;

    switch (errorType) {
        case 'unsupported-code':
            throw new Error('The supplied currency code is not supported.');
        case 'malformed-request':
            throw new Error(
                'The request structure is invalid. Please check the request format.'
            );
        case 'invalid-key':
            throw new Error('The provided API key is invalid.');
        case 'inactive-account':
            throw new Error(
                'Your account is inactive. Please confirm your email address.'
            );
        case 'quota-reached':
            throw new Error(
                'Your account has reached the maximum number of requests allowed by your plan.'
            );
        case 'unknown-code':
        default:
            throw new Error(
                'An unknown error occurred. Please refer to the API documentation.'
            );
    }
};
