import type { Standard } from '@minimum-standards/shared-model';
import { computeStandardHistory, PeriodHistoryLogSlice } from '../standardHistory';

const standard = (overrides: Partial<Standard> = {}): Standard => ({
  id: 'std-1',
  activityId: 'act-1',
  minimum: 100,
  unit: 'calls',
  cadence: { interval: 1, unit: 'week' },
  state: 'active',
  summary: '100 calls / week',
  archivedAtMs: null,
  createdAtMs: 1,
  updatedAtMs: 1,
  deletedAtMs: null,
  periodStartPreference: null,
  ...overrides,
});

describe('computeStandardHistory', () => {
  describe('period window calculation for multiple periods', () => {
    test('calculates period windows going back in time correctly', () => {
      const now = new Date('2025-12-11T12:00:00Z').getTime();
      const logs: PeriodHistoryLogSlice[] = [
        {
          id: 'log-1',
          standardId: 'std-1',
          value: 50,
          occurredAtMs: new Date('2025-12-10T10:00:00Z').getTime(), // Current week
        },
        {
          id: 'log-2',
          standardId: 'std-1',
          value: 75,
          occurredAtMs: new Date('2025-12-03T10:00:00Z').getTime(), // Previous week
        },
        {
          id: 'log-3',
          standardId: 'std-1',
          value: 100,
          occurredAtMs: new Date('2025-11-26T10:00:00Z').getTime(), // Week before that
        },
      ];

      const history = computeStandardHistory(standard(), logs, 'UTC', now);

      expect(history.length).toBeGreaterThanOrEqual(3);
      // Most recent first
      expect(history[0].total).toBe(50);
      expect(history[1].total).toBe(75);
      expect(history[2].total).toBe(100);
    });

    test('aligns history calculations to custom weekday starts', () => {
      const now = new Date('2025-12-11T12:00:00Z').getTime();
      const logs: PeriodHistoryLogSlice[] = [
        {
          id: 'log-1',
          standardId: 'std-1',
          value: 5,
          occurredAtMs: new Date('2025-12-09T10:00:00Z').getTime(), // Tuesday
        },
        {
          id: 'log-2',
          standardId: 'std-1',
          value: 15,
          occurredAtMs: new Date('2025-12-10T10:00:00Z').getTime(), // Wednesday
        },
      ];

      const history = computeStandardHistory(
        standard({
          periodStartPreference: { mode: 'weekDay', weekStartDay: 3 },
        }),
        logs,
        'UTC',
        now
      );

      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].total).toBe(15);
      expect(history[0].periodStartMs).toBe(new Date('2025-12-10T00:00:00Z').getTime());
    });

    test('handles daily cadence periods correctly', () => {
      const now = new Date('2025-12-11T12:00:00Z').getTime();
      const dailyStandard = standard({ cadence: { interval: 1, unit: 'day' }, minimum: 10 });
      const logs: PeriodHistoryLogSlice[] = [
        {
          id: 'log-1',
          standardId: 'std-1',
          value: 5,
          occurredAtMs: new Date('2025-12-11T10:00:00Z').getTime(), // Today
        },
        {
          id: 'log-2',
          standardId: 'std-1',
          value: 8,
          occurredAtMs: new Date('2025-12-10T10:00:00Z').getTime(), // Yesterday
        },
        {
          id: 'log-3',
          standardId: 'std-1',
          value: 12,
          occurredAtMs: new Date('2025-12-09T10:00:00Z').getTime(), // Day before
        },
      ];

      const history = computeStandardHistory(dailyStandard, logs, 'UTC', now);

      expect(history.length).toBeGreaterThanOrEqual(3);
      expect(history[0].total).toBe(5); // Today
      expect(history[1].total).toBe(8); // Yesterday
      expect(history[2].total).toBe(12); // Day before
    });
  });

  describe('log aggregation per period using deterministic period windows', () => {
    test('aggregates logs correctly within each period window', () => {
      const now = new Date('2025-12-11T12:00:00Z').getTime();
      const logs: PeriodHistoryLogSlice[] = [
        {
          id: 'log-1',
          standardId: 'std-1',
          value: 25,
          occurredAtMs: new Date('2025-12-10T10:00:00Z').getTime(),
        },
        {
          id: 'log-2',
          standardId: 'std-1',
          value: 30,
          occurredAtMs: new Date('2025-12-10T14:00:00Z').getTime(),
        },
        {
          id: 'log-3',
          standardId: 'std-1',
          value: 20,
          occurredAtMs: new Date('2025-12-10T18:00:00Z').getTime(),
        },
        {
          id: 'log-4',
          standardId: 'std-1',
          value: 50,
          occurredAtMs: new Date('2025-12-03T10:00:00Z').getTime(), // Previous week
        },
      ];

      const history = computeStandardHistory(standard(), logs, 'UTC', now);

      // Current period should have sum of logs 1-3
      expect(history[0].total).toBe(75); // 25 + 30 + 20
      // Previous period should have log 4
      expect(history[1].total).toBe(50);
    });

    test('excludes logs from other standards', () => {
      const now = new Date('2025-12-11T12:00:00Z').getTime();
      const logs: PeriodHistoryLogSlice[] = [
        {
          id: 'log-1',
          standardId: 'std-1',
          value: 50,
          occurredAtMs: new Date('2025-12-10T10:00:00Z').getTime(),
        },
        {
          id: 'log-2',
          standardId: 'std-2', // Different standard
          value: 100,
          occurredAtMs: new Date('2025-12-10T10:00:00Z').getTime(),
        },
      ];

      const history = computeStandardHistory(standard(), logs, 'UTC', now);

      expect(history[0].total).toBe(50); // Only log-1 counted
    });
  });

  describe('status derivation for historical periods', () => {
    test('derives Met status for periods that met target', () => {
      const now = new Date('2025-12-11T12:00:00Z').getTime();
      const logs: PeriodHistoryLogSlice[] = [
        {
          id: 'log-1',
          standardId: 'std-1',
          value: 120, // Exceeds minimum of 100
          occurredAtMs: new Date('2025-12-03T10:00:00Z').getTime(), // In past period
        },
      ];

      const history = computeStandardHistory(standard(), logs, 'UTC', now);

      expect(history.length).toBeGreaterThan(0);
      const pastPeriod = history.find((entry) => entry.total === 120);
      expect(pastPeriod).toBeDefined();
      expect(pastPeriod?.status).toBe('Met');
    });

    test('derives Missed status for periods that ended below target', () => {
      const now = new Date('2025-12-11T12:00:00Z').getTime();
      const logs: PeriodHistoryLogSlice[] = [
        {
          id: 'log-1',
          standardId: 'std-1',
          value: 50, // Below minimum of 100
          occurredAtMs: new Date('2025-12-03T10:00:00Z').getTime(), // Past period (ended)
        },
      ];

      const history = computeStandardHistory(standard(), logs, 'UTC', now);

      expect(history.length).toBeGreaterThan(0);
      const pastPeriod = history.find((entry) => entry.total === 50);
      expect(pastPeriod).toBeDefined();
      // Past period that ended below target should be Missed
      expect(pastPeriod?.status).toBe('Missed');
    });

    test('derives In Progress status for current period below target', () => {
      const now = new Date('2025-12-11T12:00:00Z').getTime();
      const logs: PeriodHistoryLogSlice[] = [
        {
          id: 'log-1',
          standardId: 'std-1',
          value: 50, // Below minimum of 100
          occurredAtMs: new Date('2025-12-10T10:00:00Z').getTime(), // Current period (not ended)
        },
      ];

      const history = computeStandardHistory(standard(), logs, 'UTC', now);

      expect(history.length).toBeGreaterThan(0);
      const currentPeriod = history[0];
      expect(currentPeriod.total).toBe(50);
      // Current period below target should be In Progress
      expect(currentPeriod.status).toBe('In Progress');
    });
  });

  describe('empty history handling', () => {
    test('returns empty array when no logs exist', () => {
      const now = new Date('2025-12-11T12:00:00Z').getTime();
      const logs: PeriodHistoryLogSlice[] = [];

      const history = computeStandardHistory(standard(), logs, 'UTC', now);

      expect(history).toEqual([]);
    });

    test('stops iterating when no more logs found in previous periods', () => {
      const now = new Date('2025-12-11T12:00:00Z').getTime();
      const logs: PeriodHistoryLogSlice[] = [
        {
          id: 'log-1',
          standardId: 'std-1',
          value: 50,
          occurredAtMs: new Date('2025-12-10T10:00:00Z').getTime(), // Current period only
        },
      ];

      const history = computeStandardHistory(standard(), logs, 'UTC', now);

      // Should only have current period, not infinite empty periods
      expect(history.length).toBe(1);
      expect(history[0].total).toBe(50);
    });
  });
});
