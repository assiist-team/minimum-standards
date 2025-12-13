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
});
