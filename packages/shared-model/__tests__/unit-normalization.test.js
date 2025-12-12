"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unit_normalization_1 = require("../src/unit-normalization");
describe('normalizeUnitToPlural', () => {
    test('converts singular to plural', () => {
        expect((0, unit_normalization_1.normalizeUnitToPlural)('call')).toBe('calls');
        expect((0, unit_normalization_1.normalizeUnitToPlural)('workout')).toBe('workouts');
        expect((0, unit_normalization_1.normalizeUnitToPlural)('page')).toBe('pages');
    });
    test('preserves plural input without duplication', () => {
        expect((0, unit_normalization_1.normalizeUnitToPlural)('calls')).toBe('calls');
        expect((0, unit_normalization_1.normalizeUnitToPlural)('workouts')).toBe('workouts');
        expect((0, unit_normalization_1.normalizeUnitToPlural)('pages')).toBe('pages');
    });
    test('handles irregular plurals', () => {
        expect((0, unit_normalization_1.normalizeUnitToPlural)('child')).toBe('children');
        expect((0, unit_normalization_1.normalizeUnitToPlural)('person')).toBe('people');
    });
    test('handles already plural irregular forms', () => {
        expect((0, unit_normalization_1.normalizeUnitToPlural)('children')).toBe('children');
        expect((0, unit_normalization_1.normalizeUnitToPlural)('people')).toBe('people');
    });
    test('rejects blank strings', () => {
        expect(() => (0, unit_normalization_1.normalizeUnitToPlural)('')).toThrow('Unit cannot be blank');
        expect(() => (0, unit_normalization_1.normalizeUnitToPlural)('   ')).toThrow('Unit cannot be blank');
    });
    test('rejects units exceeding 40 characters', () => {
        const longUnit = 'a'.repeat(41);
        expect(() => (0, unit_normalization_1.normalizeUnitToPlural)(longUnit)).toThrow('Unit cannot exceed 40 characters');
    });
    test('accepts units exactly 40 characters', () => {
        const unit = 'a'.repeat(40);
        expect(() => (0, unit_normalization_1.normalizeUnitToPlural)(unit)).not.toThrow();
    });
    test('trims whitespace before processing', () => {
        expect((0, unit_normalization_1.normalizeUnitToPlural)('  call  ')).toBe('calls');
        expect((0, unit_normalization_1.normalizeUnitToPlural)('  calls  ')).toBe('calls');
    });
});
describe('formatUnitWithCount', () => {
    test('formats singular for count of 1', () => {
        expect((0, unit_normalization_1.formatUnitWithCount)('calls', 1)).toBe('call');
        expect((0, unit_normalization_1.formatUnitWithCount)('workouts', 1)).toBe('workout');
    });
    test('formats plural for count not equal to 1', () => {
        expect((0, unit_normalization_1.formatUnitWithCount)('calls', 0)).toBe('calls');
        expect((0, unit_normalization_1.formatUnitWithCount)('calls', 2)).toBe('calls');
        expect((0, unit_normalization_1.formatUnitWithCount)('calls', 20)).toBe('calls');
    });
    test('handles irregular plurals correctly', () => {
        expect((0, unit_normalization_1.formatUnitWithCount)('children', 1)).toBe('child');
        expect((0, unit_normalization_1.formatUnitWithCount)('children', 2)).toBe('children');
        expect((0, unit_normalization_1.formatUnitWithCount)('people', 1)).toBe('person');
        expect((0, unit_normalization_1.formatUnitWithCount)('people', 2)).toBe('people');
    });
});
//# sourceMappingURL=unit-normalization.test.js.map