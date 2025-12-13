"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const standard_summary_1 = require("../src/standard-summary");
describe('formatStandardSummary', () => {
    test('formats weekly cadence correctly', () => {
        const result = (0, standard_summary_1.formatStandardSummary)(1000, 'calls', { interval: 1, unit: 'week' });
        expect(result).toBe('1000 calls / week');
    });
    test('formats daily cadence correctly', () => {
        const result = (0, standard_summary_1.formatStandardSummary)(50, 'minutes', { interval: 1, unit: 'day' });
        expect(result).toBe('50 minutes / day');
    });
    test('formats monthly cadence correctly', () => {
        const result = (0, standard_summary_1.formatStandardSummary)(10, 'meetings', { interval: 1, unit: 'month' });
        expect(result).toBe('10 meetings / month');
    });
    test('formats custom interval cadence correctly', () => {
        const result = (0, standard_summary_1.formatStandardSummary)(50, 'minutes', { interval: 2, unit: 'day' });
        expect(result).toBe('50 minutes / 2 days');
    });
    test('formats custom interval with week unit', () => {
        const result = (0, standard_summary_1.formatStandardSummary)(100, 'workouts', { interval: 3, unit: 'week' });
        expect(result).toBe('100 workouts / 3 weeks');
    });
    test('handles zero minimum', () => {
        const result = (0, standard_summary_1.formatStandardSummary)(0, 'items', { interval: 1, unit: 'day' });
        expect(result).toBe('0 items / day');
    });
    test('handles large numbers', () => {
        const result = (0, standard_summary_1.formatStandardSummary)(10000, 'steps', { interval: 1, unit: 'day' });
        expect(result).toBe('10000 steps / day');
    });
});
//# sourceMappingURL=standard-summary.test.js.map