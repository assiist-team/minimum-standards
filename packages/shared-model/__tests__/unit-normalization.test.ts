import { normalizeUnitToPlural, formatUnitWithCount } from '../src/unit-normalization';

describe('normalizeUnitToPlural', () => {
  test('converts singular to plural', () => {
    expect(normalizeUnitToPlural('call')).toBe('calls');
    expect(normalizeUnitToPlural('workout')).toBe('workouts');
    expect(normalizeUnitToPlural('page')).toBe('pages');
  });

  test('preserves plural input without duplication', () => {
    expect(normalizeUnitToPlural('calls')).toBe('calls');
    expect(normalizeUnitToPlural('workouts')).toBe('workouts');
    expect(normalizeUnitToPlural('pages')).toBe('pages');
  });

  test('handles irregular plurals', () => {
    expect(normalizeUnitToPlural('child')).toBe('children');
    expect(normalizeUnitToPlural('person')).toBe('people');
  });

  test('handles already plural irregular forms', () => {
    expect(normalizeUnitToPlural('children')).toBe('children');
    expect(normalizeUnitToPlural('people')).toBe('people');
  });

  test('rejects blank strings', () => {
    expect(() => normalizeUnitToPlural('')).toThrow('Unit cannot be blank');
    expect(() => normalizeUnitToPlural('   ')).toThrow('Unit cannot be blank');
  });

  test('rejects units exceeding 40 characters', () => {
    const longUnit = 'a'.repeat(41);
    expect(() => normalizeUnitToPlural(longUnit)).toThrow('Unit cannot exceed 40 characters');
  });

  test('accepts units exactly 40 characters', () => {
    const unit = 'a'.repeat(40);
    expect(() => normalizeUnitToPlural(unit)).not.toThrow();
  });

  test('trims whitespace before processing', () => {
    expect(normalizeUnitToPlural('  call  ')).toBe('calls');
    expect(normalizeUnitToPlural('  calls  ')).toBe('calls');
  });
});

describe('formatUnitWithCount', () => {
  test('formats singular for count of 1', () => {
    expect(formatUnitWithCount('calls', 1)).toBe('call');
    expect(formatUnitWithCount('workouts', 1)).toBe('workout');
  });

  test('formats plural for count not equal to 1', () => {
    expect(formatUnitWithCount('calls', 0)).toBe('calls');
    expect(formatUnitWithCount('calls', 2)).toBe('calls');
    expect(formatUnitWithCount('calls', 20)).toBe('calls');
  });

  test('handles irregular plurals correctly', () => {
    expect(formatUnitWithCount('children', 1)).toBe('child');
    expect(formatUnitWithCount('children', 2)).toBe('children');
    expect(formatUnitWithCount('people', 1)).toBe('person');
    expect(formatUnitWithCount('people', 2)).toBe('people');
  });
});
