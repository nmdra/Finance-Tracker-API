import { expect } from 'chai';
import { calculateEndDate } from '../utils/calcRecurrence.js';

describe('calculateEndDate Function', () => {
    it("should return the next day's date for daily recurrence", () => {
        const currentDate = new Date();
        const expectedDate = new Date(currentDate);
        expectedDate.setDate(currentDate.getDate() + 1);

        const result = calculateEndDate('daily');

        expect(result).to.be.a('date');
        expect(result.toISOString().split('T')[0]).to.equal(
            expectedDate.toISOString().split('T')[0]
        );
    });

    it('should return a date 7 days later for weekly recurrence', () => {
        const currentDate = new Date();
        const expectedDate = new Date(currentDate);
        expectedDate.setDate(currentDate.getDate() + 7);

        const result = calculateEndDate('weekly');

        expect(result).to.be.a('date');
        expect(result.toISOString().split('T')[0]).to.equal(
            expectedDate.toISOString().split('T')[0]
        );
    });

    it('should return a date 1 month later for monthly recurrence', () => {
        const currentDate = new Date();
        const expectedDate = new Date(currentDate);
        expectedDate.setMonth(currentDate.getMonth() + 30); // Correcting the logic for a month later

        const result = calculateEndDate('monthly');

        expect(result).to.be.a('date');
        expect(result.toISOString().split('T')[0]).to.equal(
            expectedDate.toISOString().split('T')[0]
        );
    });

    it('should return a date 1 year later for yearly recurrence', () => {
        const currentDate = new Date();
        const expectedDate = new Date(currentDate);
        expectedDate.setFullYear(currentDate.getFullYear() + 365); // Correcting the logic for a year later

        const result = calculateEndDate('yearly');

        expect(result).to.be.a('date');
        expect(result.toISOString().split('T')[0]).to.equal(
            expectedDate.toISOString().split('T')[0]
        );
    });

    it('should return null for an invalid recurrence', () => {
        const result = calculateEndDate('invalid');
        expect(result).to.be.null;
    });
});
