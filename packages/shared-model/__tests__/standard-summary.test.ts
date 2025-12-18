import { formatStandardSummary } from '../src/standard-summary';

describe('formatStandardSummary', () => {
  test('formats weekly cadence correctly', () => {
    const result = formatStandardSummary(1000, 'calls', { interval: 1, unit: 'week' });
    expect(result).toBe('1000 calls / week');
  });

  test('formats daily cadence correctly', () => {
    const result = formatStandardSummary(50, 'minutes', { interval: 1, unit: 'day' });
    expect(result).toBe('50 minutes / day');
  });

  test('formats monthly cadence correctly', () => {
    const result = formatStandardSummary(10, 'meetings', { interval: 1, unit: 'month' });
    expect(result).toBe('10 meetings / month');
  });

  test('formats custom interval cadence correctly', () => {
    const result = formatStandardSummary(50, 'minutes', { interval: 2, unit: 'day' });
    expect(result).toBe('50 minutes / 2 days');
  });

  test('formats custom interval with week unit', () => {
    const result = formatStandardSummary(100, 'workouts', { interval: 3, unit: 'week' });
    expect(result).toBe('100 workouts / 3 weeks');
  });

  test('handles zero minimum', () => {
    const result = formatStandardSummary(0, 'items', { interval: 1, unit: 'day' });
    expect(result).toBe('0 items / day');
  });

  test('handles large numbers', () => {
    const result = formatStandardSummary(10000, 'steps', { interval: 1, unit: 'day' });
    expect(result).toBe('10000 steps / day');
  });

  test('formats session-based summary when sessionsPerCadence > 1', () => {
    const result = formatStandardSummary(
      75,
      'minutes',
      { interval: 1, unit: 'week' },
      { sessionLabel: 'session', sessionsPerCadence: 5, volumePerSession: 15 }
    );
    expect(result).toBe('5 sessions × 15 minutes = 75 minutes / week');
  });

  test('formats direct minimum mode when sessionsPerCadence === 1', () => {
    const result = formatStandardSummary(
      1000,
      'calls',
      { interval: 1, unit: 'week' },
      { sessionLabel: 'session', sessionsPerCadence: 1, volumePerSession: 1000 }
    );
    expect(result).toBe('1000 calls / week');
  });

  test('formats session-based summary with custom session label', () => {
    const result = formatStandardSummary(
      30,
      'miles',
      { interval: 1, unit: 'week' },
      { sessionLabel: 'run', sessionsPerCadence: 3, volumePerSession: 10 }
    );
    expect(result).toBe('3 runs × 10 miles = 30 miles / week');
  });

  test('formats session-based summary with single session (pluralization)', () => {
    const result = formatStandardSummary(
      15,
      'minutes',
      { interval: 1, unit: 'day' },
      { sessionLabel: 'session', sessionsPerCadence: 1, volumePerSession: 15 }
    );
    expect(result).toBe('15 minutes / day');
  });
});
