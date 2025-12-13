import type { Standard } from '@minimum-standards/shared-model';
import {
  buildOrderedStandards,
  movePinToIndex,
  sanitizePinOrder,
  togglePin,
} from '../dashboardPins';

const baseStandard = (overrides: Partial<Standard>): Standard => ({
  id: 'standard',
  activityId: 'activity',
  minimum: 10,
  unit: 'calls',
  cadence: { interval: 1, unit: 'week' },
  state: 'active',
  summary: '10 calls / week',
  archivedAtMs: null,
  createdAtMs: 1,
  updatedAtMs: 1,
  deletedAtMs: null,
  ...overrides,
});

describe('dashboardPins utilities', () => {
  test('pinned standards stay in saved order and precede fallback items', () => {
    const standards: Standard[] = [
      baseStandard({ id: 's1', updatedAtMs: 100 }),
      baseStandard({ id: 's2', updatedAtMs: 200 }),
      baseStandard({ id: 's3', updatedAtMs: 300 }),
    ];

    const { orderedActiveStandards, pinnedStandards } = buildOrderedStandards(
      standards,
      ['s3', 's1']
    );

    expect(pinnedStandards.map((standard) => standard.id)).toEqual(['s3', 's1']);
    expect(orderedActiveStandards.map((standard) => standard.id)).toEqual([
      's3',
      's1',
      's2',
    ]);
  });

  test('fallback ordering uses updatedAt descending when unpinned', () => {
    const standards: Standard[] = [
      baseStandard({ id: 's1', updatedAtMs: 100 }),
      baseStandard({ id: 's2', updatedAtMs: 400 }),
      baseStandard({ id: 's3', updatedAtMs: 300 }),
      baseStandard({ id: 's4', updatedAtMs: 200 }),
    ];

    const { orderedActiveStandards } = buildOrderedStandards(standards, ['s3']);

    expect(orderedActiveStandards.map((standard) => standard.id)).toEqual([
      's3',
      's2',
      's4',
      's1',
    ]);
  });

  test('sanitizePinOrder removes missing/archived standards and de-dupes ids', () => {
    const standards: Standard[] = [
      baseStandard({ id: 's1' }),
      baseStandard({ id: 's2' }),
    ];

    const sanitized = sanitizePinOrder(['s1', 's-missing', 's1', 's2'], standards);
    expect(sanitized).toEqual(['s1', 's2']);
  });

  test('movePinToIndex repositions pins while maintaining uniqueness', () => {
    const initial = ['s1', 's2', 's3'];
    expect(movePinToIndex(initial, 's3', 0)).toEqual(['s3', 's1', 's2']);
    expect(movePinToIndex(initial, 's4', 1)).toEqual(['s1', 's4', 's2', 's3']);
  });

  test('togglePin adds or removes pins without duplicates', () => {
    expect(togglePin(['s1'], 's2', true)).toEqual(['s2', 's1']);
    expect(togglePin(['s1', 's2'], 's1', false)).toEqual(['s2']);
  });
});
