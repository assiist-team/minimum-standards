import {
  CADENCE_PRESETS,
  getCadencePreset,
  validateCadence,
  createCustomCadence,
  isPresetCadence,
} from '../cadenceUtils';
import { StandardCadence } from '@minimum-standards/shared-model';

describe('cadenceUtils', () => {
  describe('CADENCE_PRESETS', () => {
    test('defines correct preset values', () => {
      expect(CADENCE_PRESETS.daily).toEqual({ interval: 1, unit: 'day' });
      expect(CADENCE_PRESETS.weekly).toEqual({ interval: 1, unit: 'week' });
      expect(CADENCE_PRESETS.monthly).toEqual({ interval: 1, unit: 'month' });
    });
  });

  describe('getCadencePreset', () => {
    test('returns correct preset for daily', () => {
      expect(getCadencePreset('daily')).toEqual({ interval: 1, unit: 'day' });
    });

    test('returns correct preset for weekly', () => {
      expect(getCadencePreset('weekly')).toEqual({ interval: 1, unit: 'week' });
    });

    test('returns correct preset for monthly', () => {
      expect(getCadencePreset('monthly')).toEqual({ interval: 1, unit: 'month' });
    });
  });

  describe('validateCadence', () => {
    test('returns valid for correct daily cadence', () => {
      const result = validateCadence(1, 'day');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('returns valid for correct weekly cadence', () => {
      const result = validateCadence(1, 'week');
      expect(result.isValid).toBe(true);
    });

    test('returns valid for correct monthly cadence', () => {
      const result = validateCadence(1, 'month');
      expect(result.isValid).toBe(true);
    });

    test('returns valid for custom interval', () => {
      const result = validateCadence(2, 'week');
      expect(result.isValid).toBe(true);
    });

    test('returns invalid when interval is null', () => {
      const result = validateCadence(null, 'day');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Interval and unit are required');
    });

    test('returns invalid when unit is null', () => {
      const result = validateCadence(1, null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Interval and unit are required');
    });

    test('returns invalid when interval is not an integer', () => {
      const result = validateCadence(1.5, 'day');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Interval must be a positive integer');
    });

    test('returns invalid when interval is zero', () => {
      const result = validateCadence(0, 'day');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Interval must be a positive integer');
    });

    test('returns invalid when interval is negative', () => {
      const result = validateCadence(-1, 'day');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Interval must be a positive integer');
    });

    test('returns invalid for invalid unit', () => {
      const result = validateCadence(1, 'invalid' as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Unit must be day, week, or month');
    });
  });

  describe('createCustomCadence', () => {
    test('creates valid cadence for correct input', () => {
      const cadence = createCustomCadence(2, 'week');
      expect(cadence).toEqual({ interval: 2, unit: 'week' });
    });

    test('returns null for invalid interval', () => {
      const cadence = createCustomCadence(0, 'day');
      expect(cadence).toBeNull();
    });

    test('returns null for invalid unit', () => {
      const cadence = createCustomCadence(1, 'invalid' as any);
      expect(cadence).toBeNull();
    });

    test('returns null for null inputs', () => {
      const cadence = createCustomCadence(null, null);
      expect(cadence).toBeNull();
    });
  });

  describe('isPresetCadence', () => {
    test('returns true for daily preset', () => {
      const cadence: StandardCadence = { interval: 1, unit: 'day' };
      expect(isPresetCadence(cadence, 'daily')).toBe(true);
    });

    test('returns true for weekly preset', () => {
      const cadence: StandardCadence = { interval: 1, unit: 'week' };
      expect(isPresetCadence(cadence, 'weekly')).toBe(true);
    });

    test('returns true for monthly preset', () => {
      const cadence: StandardCadence = { interval: 1, unit: 'month' };
      expect(isPresetCadence(cadence, 'monthly')).toBe(true);
    });

    test('returns false for custom cadence', () => {
      const cadence: StandardCadence = { interval: 2, unit: 'week' };
      expect(isPresetCadence(cadence, 'weekly')).toBe(false);
    });

    test('returns false for null cadence', () => {
      expect(isPresetCadence(null, 'daily')).toBe(false);
    });

    test('returns false when interval matches but unit does not', () => {
      const cadence: StandardCadence = { interval: 1, unit: 'day' };
      expect(isPresetCadence(cadence, 'weekly')).toBe(false);
    });
  });
});
