import type { Standard } from '@minimum-standards/shared-model';
import { buildDashboardProgressMap } from '../dashboardProgress';

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
  sessionConfig: {
    sessionLabel: 'session',
    sessionsPerCadence: 1,
    volumePerSession: 100,
  },
  ...overrides,
});

describe('buildDashboardProgressMap', () => {
  test('formats period label and sums logs within window', () => {
    const now = new Date('2025-12-10T12:00:00Z').getTime();
    const logs = [
      {
        id: 'log-1',
        standardId: 'std-1',
        value: 25,
        occurredAtMs: new Date('2025-12-09T00:00:00Z').getTime(),
      },
    ];

    const progress = buildDashboardProgressMap({
      standards: [standard()],
      logs,
      timezone: 'UTC',
      nowMs: now,
    });

    expect(progress['std-1'].currentTotal).toBe(25);
    expect(progress['std-1'].periodLabel).toContain('December');
  });

  test('caps progress percent at 100 even when totals exceed target', () => {
    const now = new Date('2025-12-10T12:00:00Z').getTime();
    const logs = [
      {
        id: 'log-1',
        standardId: 'std-1',
        value: 200,
        occurredAtMs: now,
      },
    ];

    const progress = buildDashboardProgressMap({
      standards: [standard()],
      logs,
      timezone: 'UTC',
      nowMs: now,
    });

    expect(progress['std-1'].progressPercent).toBe(100);
  });

  test('derives Missed status when period ended below target', () => {
    const now = new Date('2025-12-10T12:00:00Z').getTime();
    const previousPeriodReference = new Date('2025-12-09T12:00:00Z').getTime();
    const standardConfig = standard({ cadence: { interval: 1, unit: 'day' }, minimum: 50 });
    const logs = [
      {
        id: 'log-1',
        standardId: 'std-1',
        value: 10,
        occurredAtMs: previousPeriodReference,
      },
    ];

    const progress = buildDashboardProgressMap({
      standards: [standardConfig],
      logs,
      timezone: 'UTC',
      nowMs: now,
      windowReferenceMs: previousPeriodReference,
    });

    expect(progress['std-1'].status).toBe('Missed');
  });

  test('zero values display correctly in period totals', () => {
    const now = new Date('2025-12-10T12:00:00Z').getTime();
    const logs = [
      {
        id: 'log-1',
        standardId: 'std-1',
        value: 0,
        occurredAtMs: new Date('2025-12-09T00:00:00Z').getTime(),
      },
      {
        id: 'log-2',
        standardId: 'std-1',
        value: 0,
        occurredAtMs: new Date('2025-12-09T12:00:00Z').getTime(),
      },
    ];

    const progress = buildDashboardProgressMap({
      standards: [standard({ minimum: 1000 })],
      logs,
      timezone: 'UTC',
      nowMs: now,
    });

    expect(progress['std-1'].currentTotal).toBe(0);
    expect(progress['std-1'].currentTotalFormatted).toBe('0');
    expect(progress['std-1'].progressPercent).toBe(0);
    expect(progress['std-1'].status).toBe('In Progress'); // Current period, not ended yet
  });

  describe('windowReferenceMs behavior', () => {
    test('uses windowReferenceMs instead of nowMs for period calculation', () => {
      const nowMs = new Date('2025-12-11T12:00:00Z').getTime(); // Current time
      const windowReferenceMs = new Date('2025-12-10T12:00:00Z').getTime(); // Previous day
      const logs = [
        {
          id: 'log-1',
          standardId: 'std-1',
          value: 50,
          occurredAtMs: new Date('2025-12-10T10:00:00Z').getTime(), // In the reference window
        },
        {
          id: 'log-2',
          standardId: 'std-1',
          value: 30,
          occurredAtMs: new Date('2025-12-11T10:00:00Z').getTime(), // In current time window but not reference
        },
      ];

      const dailyStandard = standard({ cadence: { interval: 1, unit: 'day' } });
      const progress = buildDashboardProgressMap({
        standards: [dailyStandard],
        logs,
        timezone: 'UTC',
        nowMs,
        windowReferenceMs,
      });

      // Should only count logs in the reference window (log-1)
      expect(progress['std-1'].currentTotal).toBe(50);
      expect(progress['std-1'].periodLabel).toContain('December 10, 2025'); // Reference day's label
    });

    test('period label reflects windowReferenceMs, not nowMs', () => {
      const nowMs = new Date('2025-12-11T12:00:00Z').getTime();
      const windowReferenceMs = new Date('2025-12-09T12:00:00Z').getTime(); // Two days earlier
      const logs: any[] = [];

      const dailyStandard = standard({ cadence: { interval: 1, unit: 'day' } });
      const progress = buildDashboardProgressMap({
        standards: [dailyStandard],
        logs,
        timezone: 'UTC',
        nowMs,
        windowReferenceMs,
      });

      // Period label should be for Dec 9, not Dec 11
      expect(progress['std-1'].periodLabel).toContain('December 9, 2025');
    });

    test('falls back to nowMs when windowReferenceMs is not provided', () => {
      const nowMs = new Date('2025-12-10T12:00:00Z').getTime();
      const logs = [
        {
          id: 'log-1',
          standardId: 'std-1',
          value: 25,
          occurredAtMs: new Date('2025-12-10T10:00:00Z').getTime(),
        },
      ];

      const dailyStandard = standard({ cadence: { interval: 1, unit: 'day' } });
      const progress = buildDashboardProgressMap({
        standards: [dailyStandard],
        logs,
        timezone: 'UTC',
        nowMs,
        // windowReferenceMs not provided
      });

      // Should use nowMs as fallback
      expect(progress['std-1'].currentTotal).toBe(25);
      expect(progress['std-1'].periodLabel).toBeDefined();
    });

    test('handles windowReferenceMs for weekly cadence', () => {
      const nowMs = new Date('2025-12-15T12:00:00Z').getTime(); // Sunday
      const windowReferenceMs = new Date('2025-12-08T12:00:00Z').getTime(); // Previous Monday
      const logs = [
        {
          id: 'log-1',
          standardId: 'std-1',
          value: 100,
          occurredAtMs: new Date('2025-12-08T10:00:00Z').getTime(), // In reference week
        },
        {
          id: 'log-2',
          standardId: 'std-1',
          value: 50,
          occurredAtMs: new Date('2025-12-16T10:00:00Z').getTime(), // In current week but not reference
        },
      ];

      const weeklyStandard = standard({ cadence: { interval: 1, unit: 'week' } });
      const progress = buildDashboardProgressMap({
        standards: [weeklyStandard],
        logs,
        timezone: 'UTC',
        nowMs,
        windowReferenceMs,
      });

      // Should only count logs in the reference week
      expect(progress['std-1'].currentTotal).toBe(100);
    });

    test('handles windowReferenceMs for monthly cadence', () => {
      const nowMs = new Date('2025-12-15T12:00:00Z').getTime();
      const windowReferenceMs = new Date('2025-11-15T12:00:00Z').getTime(); // Previous month
      const logs = [
        {
          id: 'log-1',
          standardId: 'std-1',
          value: 200,
          occurredAtMs: new Date('2025-11-10T10:00:00Z').getTime(), // In reference month
        },
        {
          id: 'log-2',
          standardId: 'std-1',
          value: 150,
          occurredAtMs: new Date('2025-12-10T10:00:00Z').getTime(), // In current month but not reference
        },
      ];

      const monthlyStandard = standard({ cadence: { interval: 1, unit: 'month' } });
      const progress = buildDashboardProgressMap({
        standards: [monthlyStandard],
        logs,
        timezone: 'UTC',
        nowMs,
        windowReferenceMs,
      });

      // Should only count logs in the reference month
      expect(progress['std-1'].currentTotal).toBe(200);
    });

    test('status derivation uses nowMs even when windowReferenceMs is provided', () => {
      const nowMs = new Date('2025-12-11T12:00:00Z').getTime(); // After period ended
      const windowReferenceMs = new Date('2025-12-10T12:00:00Z').getTime(); // Reference to previous day
      const periodEndMs = new Date('2025-12-11T00:00:00Z').getTime(); // Period ended at midnight
      
      const logs = [
        {
          id: 'log-1',
          standardId: 'std-1',
          value: 50, // Below minimum of 100
          occurredAtMs: new Date('2025-12-10T10:00:00Z').getTime(),
        },
      ];

      const dailyStandard = standard({ 
        cadence: { interval: 1, unit: 'day' },
        minimum: 100,
      });
      
      const progress = buildDashboardProgressMap({
        standards: [dailyStandard],
        logs,
        timezone: 'UTC',
        nowMs,
        windowReferenceMs,
      });

      // Status should be Missed because nowMs >= periodEndMs and total < minimum
      expect(progress['std-1'].status).toBe('Missed');
      expect(progress['std-1'].currentTotal).toBe(50);
    });
  });
});
