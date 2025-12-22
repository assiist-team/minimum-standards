import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  collection,
  doc,
  query,
  where,
  Timestamp,
  getDocs,
} from '@react-native-firebase/firestore';
import { firebaseAuth, firebaseFirestore } from '../firebase/firebaseApp';
import { useStandards } from './useStandards';
import {
  Standard,
  calculatePeriodWindow,
  derivePeriodStatus,
} from '@minimum-standards/shared-model';
import {
  writeActivityHistoryPeriod,
  getLatestHistoryForStandard,
} from '../utils/activityHistoryFirestore';

/**
 * Global Activity History Engine hook.
 * 
 * This hook automatically generates activityHistory documents for completed periods
 * of active standards. It runs independently of dashboard visibility.
 * 
 * Mount this hook once at the authenticated app root (e.g., BottomTabNavigator).
 */
export function useActivityHistoryEngine() {
  const { orderedActiveStandards } = useStandards();
  const userId = firebaseAuth.currentUser?.uid;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRunningCatchUpRef = useRef(false);

  /**
   * Computes rollups for a period window by querying logs.
   */
  const computeRollupsForPeriod = useCallback(
    async (
      standard: Standard,
      window: { startMs: number; endMs: number },
      nowMs: number
    ) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Query logs for this standard in the period window
      const logsQuery = query(
        collection(doc(firebaseFirestore, 'users', userId), 'activityLogs'),
        where('standardId', '==', standard.id),
        where('occurredAt', '>=', Timestamp.fromMillis(window.startMs)),
        where('occurredAt', '<', Timestamp.fromMillis(window.endMs))
      );

      const snapshot = await getDocs(logsQuery);
      const logs: Array<{ value: number }> = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Exclude soft-deleted logs
        if (data.deletedAt) {
          return;
        }
        if (typeof data.value === 'number' && data.occurredAt) {
          logs.push({ value: data.value });
        }
      });

      const total = logs.reduce((sum, log) => sum + log.value, 0);
      const currentSessions = logs.length;
      const targetSessions = standard.sessionConfig.sessionsPerCadence;
      const status = derivePeriodStatus(
        total,
        standard.minimum,
        nowMs,
        window.endMs
      );
      const safeMinimum = Math.max(standard.minimum, 0);
      const ratio = safeMinimum === 0 ? 1 : Math.min(total / safeMinimum, 1);
      const progressPercent = Number((ratio * 100).toFixed(2));

      return {
        total,
        currentSessions,
        targetSessions,
        status,
        progressPercent,
      };
    },
    [userId]
  );

  /**
   * Catch-up routine: generates history for all completed periods since the last generated period.
   */
  const runCatchUp = useCallback(
    async (source: 'boundary' | 'resume') => {
      if (!userId || orderedActiveStandards.length === 0) {
        return;
      }

      // Prevent concurrent catch-up runs
      if (isRunningCatchUpRef.current) {
        console.log('[useActivityHistoryEngine] Catch-up already running, skipping');
        return;
      }

      isRunningCatchUpRef.current = true;
      const nowMs = Date.now();

      try {
        for (const standard of orderedActiveStandards) {
          // Only process active standards
          if (standard.state !== 'active') {
            continue;
          }

          // Get latest history for this standard
          const latestHistory = await getLatestHistoryForStandard(userId, standard.id);

          // Determine starting reference time
          let startReference: number;
          if (latestHistory) {
            // Start from the end of the latest period (catch up from there)
            startReference = latestHistory.periodEndMs;
          } else {
            // No history exists - start from current period (no backfill)
            // We'll iterate forward but only generate completed periods
            const currentWindow = calculatePeriodWindow(nowMs, standard.cadence, timezone);
            startReference = currentWindow.startMs;
          }

          // Iterate forward through completed periods
          const maxIterations = 1000; // Safety limit
          let iterations = 0;
          let currentReference = startReference;

          while (iterations < maxIterations) {
            const window = calculatePeriodWindow(currentReference, standard.cadence, timezone);

            // Stop when we reach the current period (window includes now)
            if (window.startMs <= nowMs && window.endMs > nowMs) {
              break;
            }

            // Only write for fully completed periods
            if (window.endMs <= nowMs) {
              // Compute rollups
              const rollup = await computeRollupsForPeriod(standard, window, nowMs);

              // Write history document
              await writeActivityHistoryPeriod({
                userId,
                activityId: standard.activityId,
                standardId: standard.id,
                window,
                standardSnapshot: {
                  minimum: standard.minimum,
                  unit: standard.unit,
                  cadence: standard.cadence,
                  sessionConfig: standard.sessionConfig,
                  summary: standard.summary,
                },
                rollup,
                source,
              });

              // Move to next period after writing
              currentReference = window.endMs;
            } else {
              // Window hasn't completed yet, stop
              break;
            }

            iterations++;
          }
        }
      } catch (error) {
        console.error('[useActivityHistoryEngine] Error during catch-up:', error);
      } finally {
        isRunningCatchUpRef.current = false;
      }
    },
    [userId, orderedActiveStandards, timezone, computeRollupsForPeriod]
  );

  /**
   * Schedules a timer to the earliest next boundary across all active standards.
   */
  const scheduleNextBoundary = useCallback(() => {
    if (orderedActiveStandards.length === 0) {
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const nowMs = Date.now();
    let nextBoundaryMs: number | null = null;

    // Find the earliest boundary across all active standards
    for (const standard of orderedActiveStandards) {
      if (standard.state !== 'active') {
        continue;
      }

      const window = calculatePeriodWindow(nowMs, standard.cadence, timezone);
      if (nextBoundaryMs === null || window.endMs < nextBoundaryMs) {
        nextBoundaryMs = window.endMs;
      }
    }

    if (nextBoundaryMs === null) {
      return;
    }

    // If boundary already passed, run catch-up immediately
    if (nextBoundaryMs <= nowMs) {
      runCatchUp('boundary').then(() => {
        scheduleNextBoundary(); // Reschedule after catch-up
      });
      return;
    }

    const delayMs = nextBoundaryMs - nowMs;

    // Schedule timeout to trigger catch-up at boundary
    timeoutRef.current = setTimeout(() => {
      runCatchUp('boundary').then(() => {
        scheduleNextBoundary(); // Reschedule for next boundary
      });
    }, delayMs);
  }, [orderedActiveStandards, timezone, runCatchUp]);

  // Run catch-up on mount and when standards become available
  useEffect(() => {
    if (!userId || orderedActiveStandards.length === 0) {
      return;
    }

    // Run initial catch-up when standards are available
    runCatchUp('boundary').then(() => {
      scheduleNextBoundary();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only run when userId changes (on mount), not when standards change

  // Schedule boundary timer when standards change
  useEffect(() => {
    scheduleNextBoundary();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [scheduleNextBoundary]);

  // Handle app resume
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && userId) {
        runCatchUp('resume').then(() => {
          scheduleNextBoundary();
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [userId, runCatchUp, scheduleNextBoundary]);
}

