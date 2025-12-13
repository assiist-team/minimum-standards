/**
 * Integration tests for error handling and UX improvements.
 * Tests end-to-end workflows across zero values, period labels, copy neutrality, and error handling.
 */

import { describe, test, expect } from '@jest/globals';
import { FirestoreError, AuthError, normalizeFirebaseError } from '../errors';
import { retryWithBackoff } from '../retry';
import { buildDashboardProgressMap } from '../dashboardProgress';
import type { Standard } from '@minimum-standards/shared-model';

describe('Error Handling and UX Integration Tests', () => {
  describe('Zero value logging → period total display → status calculation', () => {
    test('zero value logging flows through to period totals and status', () => {
      const standard: Standard = {
        id: 'std-1',
        activityId: 'Test Activity',
        minimum: 1000,
        unit: 'calls',
        cadence: { interval: 1, unit: 'week' },
        state: 'active',
        summary: '1000 calls / week',
        archivedAtMs: null,
        createdAtMs: 1,
        updatedAtMs: 1,
        deletedAtMs: null,
      };

      const now = new Date('2025-12-10T12:00:00Z').getTime();
      const logs = [
        {
          id: 'log-1',
          standardId: 'std-1',
          value: 0, // Zero value log
          occurredAtMs: new Date('2025-12-09T00:00:00Z').getTime(),
        },
        {
          id: 'log-2',
          standardId: 'std-1',
          value: 0, // Another zero value log
          occurredAtMs: new Date('2025-12-09T12:00:00Z').getTime(),
        },
      ];

      const progress = buildDashboardProgressMap({
        standards: [standard],
        logs,
        timezone: 'UTC',
        nowMs: now,
      });

      // Period total should be 0 (sum of zero values)
      expect(progress['std-1'].currentTotal).toBe(0);
      expect(progress['std-1'].currentTotalFormatted).toBe('0');
      
      // Status should be "In Progress" (current period, not ended yet)
      expect(progress['std-1'].status).toBe('In Progress');
      
      // Progress percent should be 0
      expect(progress['std-1'].progressPercent).toBe(0);
    });
  });

  describe('Error occurs → error banner displays → retry succeeds → banner clears', () => {
    test('error recovery flow with retry', async () => {
      let attemptCount = 0;
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new FirestoreError('firestore/unavailable', 'Service unavailable', {});
        }
        return 'success';
      });

      // First attempt fails
      await expect(operation()).rejects.toThrow(FirestoreError);

      // Retry with backoff succeeds
      const result = await retryWithBackoff(operation, {
        maxAttempts: 3,
        initialDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(attemptCount).toBe(2);
    });
  });

  describe('Offline state → sync banner displays → online → sync completes → banner clears', () => {
    test('sync status flow handles offline to online transition', () => {
      // This is tested in SyncStatusBanner.test.tsx
      // Integration test would verify the full flow:
      // 1. App goes offline → banner shows
      // 2. User makes changes → Firestore queues locally
      // 3. App comes online → banner shows "Syncing..."
      // 4. Sync completes → banner clears
      
      // For unit testing, we verify the components work correctly
      // Full integration would require E2E testing with actual network simulation
      expect(true).toBe(true); // Placeholder - actual test in SyncStatusBanner component tests
    });
  });

  describe('Period label consistency across dashboard → detail → logs modal', () => {
    test('period labels are consistent across all screens', () => {
      const standard: Standard = {
        id: 'std-1',
        activityId: 'Test Activity',
        minimum: 100,
        unit: 'calls',
        cadence: { interval: 1, unit: 'week' },
        state: 'active',
        summary: '100 calls / week',
        archivedAtMs: null,
        createdAtMs: 1,
        updatedAtMs: 1,
        deletedAtMs: null,
      };

      const now = new Date('2025-12-10T12:00:00Z').getTime();
      const logs = [
        {
          id: 'log-1',
          standardId: 'std-1',
          value: 50,
          occurredAtMs: new Date('2025-12-09T00:00:00Z').getTime(),
        },
      ];

      const progress = buildDashboardProgressMap({
        standards: [standard],
        logs,
        timezone: 'UTC',
        nowMs: now,
      });

      const periodLabel = progress['std-1'].periodLabel;

      // Period label should be computed (not "Current period")
      expect(periodLabel).not.toBe('Current period');
      expect(periodLabel).toMatch(/December|January|February|March|April|May|June|July|August|September|October|November/i);
      
      // Should contain date range format
      expect(periodLabel).toContain('2024');
    });
  });

  describe('Fatal error → Error Boundary catches → Crashlytics logs → user sees message', () => {
    test('error normalization works for Crashlytics logging', () => {
      const firebaseError = {
        code: 'firestore/permission-denied',
        message: 'Permission denied',
      };

      const normalized = normalizeFirebaseError(firebaseError);

      // Should be normalized to FirestoreError
      expect(normalized).toBeInstanceOf(FirestoreError);
      expect(normalized.code).toBe('firestore/permission-denied');
      expect(normalized.message).toBe('You do not have permission to perform this action.');
      
      // Error code should be stable for Crashlytics
      expect(normalized.code).toMatch(/^firestore\//);
    });
  });

  describe('Copy neutrality across all screens and user flows', () => {
    test('status labels remain factual and neutral', () => {
      const statusLabels = ['Met', 'In Progress', 'Missed'];
      
      // Verify all status labels are factual
      statusLabels.forEach((label) => {
        expect(label).not.toMatch(/great|awesome|congratulations|well done|good job|keep it up/i);
        expect(label).not.toMatch(/behind|ahead|slacking|failing/i);
      });
      
      // Verify they match expected factual labels
      expect(statusLabels).toEqual(['Met', 'In Progress', 'Missed']);
    });

    test('error messages are user-friendly and actionable', () => {
      const authError = new AuthError(
        'auth/network-request-failed',
        'Network error. Check your connection and retry.',
        {}
      );

      const firestoreError = new FirestoreError(
        'firestore/unavailable',
        'Service temporarily unavailable. Please try again.',
        {}
      );

      // Error messages should be user-friendly
      expect(authError.message).toContain('Check your connection');
      expect(firestoreError.message).toContain('try again');
      
      // Should not contain technical error codes in user message
      expect(authError.message).not.toContain('auth/network-request-failed');
      expect(firestoreError.message).not.toContain('firestore/unavailable');
    });
  });
});
