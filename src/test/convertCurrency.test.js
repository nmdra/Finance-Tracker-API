import { expect } from 'chai';
import nock from 'nock';
import { convertCurrency } from '../utils/currencyConverter.js'; // Adjust path if needed

const API_KEY = process.env.EXCHANGE_RATE_API_KEY || 'test-api-key';
const BASE_CURRENCY = process.env.BASE_CURRENCY || 'USD';
const EXCHANGE_API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/pair`;

describe('convertCurrency (API Response Tests)', () => {
    afterEach(() => {
        nock.cleanAll(); // Reset nock after each test
    });

    it('should return the same amount if fromCurrency and toCurrency are the same', async () => {
        const amount = 100;
        const result = await convertCurrency(amount, 'USD', 'USD');
        expect(result).to.equal('100.00');
    });

    it('should fetch exchange rate from API and convert currency', async () => {
        nock(EXCHANGE_API_URL)
            .get('/EUR/USD')
            .reply(200, { result: 'success', conversion_rate: 1.2 });

        const result = await convertCurrency(100, 'EUR', 'USD');
        expect(result).to.equal('120.00');
    });

    it('should throw an error if API key is missing', async () => {
        process.env.EXCHANGE_RATE_API_KEY = ''; // Temporarily remove API key
        try {
            await convertCurrency(100, 'EUR', 'USD');
        } catch (error) {
            expect(error.message).to.equal(
                'Currency conversion failed: Exchange Rate API key is missing'
            );
        }
    });

    it('should throw an error if API returns an error', async () => {
        nock(EXCHANGE_API_URL)
            .get('/EUR/USD')
            .reply(400, { result: 'error', 'error-type': 'invalid-key' });

        try {
            await convertCurrency(100, 'EUR', 'USD');
        } catch (error) {
            expect(error.message).to.equal(
                'Currency conversion failed: The provided API key is invalid.'
            );
        }
    });

    it('should throw an error if exchange rate is not available', async () => {
        nock(EXCHANGE_API_URL)
            .get('/EUR/USD')
            .reply(200, { result: 'success', conversion_rate: null });

        try {
            await convertCurrency(100, 'EUR', 'USD');
        } catch (error) {
            expect(error.message).to.equal(
                'Currency conversion failed: Exchange rate for USD not available'
            );
        }
    });
});
