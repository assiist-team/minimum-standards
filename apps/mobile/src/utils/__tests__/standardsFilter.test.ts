import {
  filterStandardsBySearch,
  filterStandardsByTab,
  sortStandardsBySummary,
  findMatchingStandard,
} from '../standardsFilter';
import { Standard } from '@minimum-standards/shared-model';

const mockStandard1: Standard = {
  id: '1',
  activityId: 'activity1',
  minimum: 1000,
  unit: 'calls',
  cadence: { interval: 1, unit: 'week' },
  state: 'active',
  summary: '1000 calls / week',
  archivedAtMs: null,
  createdAtMs: 1000,
  updatedAtMs: 1000,
  deletedAtMs: null,
};

const mockStandard2: Standard = {
  id: '2',
  activityId: 'activity2',
  minimum: 50,
  unit: 'minutes',
  cadence: { interval: 1, unit: 'day' },
  state: 'archived',
  summary: '50 minutes / day',
  archivedAtMs: 2000,
  createdAtMs: 2000,
  updatedAtMs: 2000,
  deletedAtMs: null,
};

const mockStandard3: Standard = {
  id: '3',
  activityId: 'activity1',
  minimum: 100,
  unit: 'workouts',
  cadence: { interval: 3, unit: 'week' },
  state: 'active',
  summary: '100 workouts / 3 weeks',
  archivedAtMs: null,
  createdAtMs: 3000,
  updatedAtMs: 3000,
  deletedAtMs: null,
};

describe('standardsFilter', () => {
  const allStandards = [mockStandard1, mockStandard2, mockStandard3];

  describe('filterStandardsBySearch', () => {
    it('returns all standards when query is empty', () => {
      const result = filterStandardsBySearch(allStandards, '');
      expect(result).toEqual(allStandards);
    });

    it('returns all standards when query is only whitespace', () => {
      const result = filterStandardsBySearch(allStandards, '   ');
      expect(result).toEqual(allStandards);
    });

    it('filters by case-insensitive substring match on summary', () => {
      const result = filterStandardsBySearch(allStandards, 'calls');
      expect(result).toEqual([mockStandard1]);
    });

    it('matches case-insensitively', () => {
      const result = filterStandardsBySearch(allStandards, 'CALLS');
      expect(result).toEqual([mockStandard1]);
    });

    it('matches partial strings', () => {
      const result = filterStandardsBySearch(allStandards, 'minute');
      expect(result).toEqual([mockStandard2]);
    });

    it('returns empty array when no matches', () => {
      const result = filterStandardsBySearch(allStandards, 'xyz');
      expect(result).toEqual([]);
    });
  });

  describe('filterStandardsByTab', () => {
    it('filters active standards correctly', () => {
      const result = filterStandardsByTab(allStandards, 'active');
      expect(result).toEqual([mockStandard1, mockStandard3]);
    });

    it('filters archived standards correctly', () => {
      const result = filterStandardsByTab(allStandards, 'archived');
      expect(result).toEqual([mockStandard2]);
    });

    it('handles active standard with archivedAtMs set', () => {
      const standardWithArchivedAt: Standard = {
        ...mockStandard1,
        archivedAtMs: 1000,
        state: 'active',
      };
      const standards = [standardWithArchivedAt];
      const result = filterStandardsByTab(standards, 'active');
      expect(result).toEqual([]);
    });

    it('handles archived standard with state archived', () => {
      const standardArchived: Standard = {
        ...mockStandard1,
        archivedAtMs: null,
        state: 'archived',
      };
      const standards = [standardArchived];
      const result = filterStandardsByTab(standards, 'archived');
      expect(result).toEqual([standardArchived]);
    });
  });

  describe('sortStandardsBySummary', () => {
    it('sorts standards alphabetically by summary', () => {
      const unsorted = [mockStandard3, mockStandard1, mockStandard2];
      const result = sortStandardsBySummary(unsorted);
      expect(result).toEqual([
        mockStandard3, // '100 workouts / 3 weeks' (starts with "1")
        mockStandard1, // '1000 calls / week' (starts with "1")
        mockStandard2, // '50 minutes / day' (starts with "5")
      ]);
    });

    it('returns new array without mutating original', () => {
      const original = [...allStandards];
      const result = sortStandardsBySummary(allStandards);
      expect(allStandards).toEqual(original);
      expect(result).not.toBe(allStandards);
    });
  });

  describe('findMatchingStandard', () => {
    it('finds matching standard by all criteria', () => {
      const result = findMatchingStandard(
        allStandards,
        'activity1',
        { interval: 1, unit: 'week' },
        1000,
        'calls'
      );
      expect(result).toEqual(mockStandard1);
    });

    it('returns undefined when activityId does not match', () => {
      const result = findMatchingStandard(
        allStandards,
        'activity999',
        { interval: 1, unit: 'week' },
        1000,
        'calls'
      );
      expect(result).toBeUndefined();
    });

    it('returns undefined when cadence does not match', () => {
      const result = findMatchingStandard(
        allStandards,
        'activity1',
        { interval: 2, unit: 'week' },
        1000,
        'calls'
      );
      expect(result).toBeUndefined();
    });

    it('returns undefined when minimum does not match', () => {
      const result = findMatchingStandard(
        allStandards,
        'activity1',
        { interval: 1, unit: 'week' },
        999,
        'calls'
      );
      expect(result).toBeUndefined();
    });

    it('returns undefined when unit does not match', () => {
      const result = findMatchingStandard(
        allStandards,
        'activity1',
        { interval: 1, unit: 'week' },
        1000,
        'call'
      );
      expect(result).toBeUndefined();
    });

    it('returns undefined when no standards match', () => {
      const result = findMatchingStandard(
        allStandards,
        'activity999',
        { interval: 999, unit: 'day' },
        999,
        'xyz'
      );
      expect(result).toBeUndefined();
    });
  });
});
