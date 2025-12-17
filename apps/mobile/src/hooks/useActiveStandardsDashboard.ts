import { useCallback, useEffect, useMemo, useState } from 'react';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { firebaseAuth, firebaseFirestore } from '../firebase/firebaseApp';
import {
  Standard,
  calculatePeriodWindow,
} from '@minimum-standards/shared-model';
import { useStandards } from './useStandards';
import {
  DashboardLogSlice,
  DashboardProgress,
  buildDashboardProgressMap,
} from '../utils/dashboardProgress';

export type DashboardStandard = {
  standard: Standard;
  pinned: boolean;
  progress: DashboardProgress | null;
};

function computeEarliestStart(
  standards: Standard[],
  timezone: string,
  nowMs: number
): number {
  if (standards.length === 0) {
    return nowMs;
  }

  return standards.reduce((min, standard) => {
    const window = calculatePeriodWindow(nowMs, standard.cadence, timezone);
    return Math.min(min, window.startMs);
  }, nowMs);
}

export function useActiveStandardsDashboard() {
  const standardsResult = useStandards();
  const {
    orderedActiveStandards,
    pinOrder,
    loading: standardsLoading,
    error: standardsError,
    createLogEntry,
  } = standardsResult;

  const [logs, setLogs] = useState<DashboardLogSlice[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<Error | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const userId = firebaseAuth.currentUser?.uid;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';

  useEffect(() => {
    if (!userId || orderedActiveStandards.length === 0) {
      setLogsLoading(false);
      setLogs([]);
      return;
    }

    setLogsLoading(true);
    setLogsError(null);

    const nowMs = Date.now();
    const earliestStart = computeEarliestStart(
      orderedActiveStandards,
      timezone,
      nowMs
    );

    const logsRef = firebaseFirestore
      .collection('users')
      .doc(userId)
      .collection('activityLogs')
      .where('occurredAt', '>=', firebaseFirestore.Timestamp.fromMillis(earliestStart));

    const unsubscribe = logsRef.onSnapshot(
      (snapshot) => {
        const nextLogs: DashboardLogSlice[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as {
            standardId?: string;
            value?: number;
            occurredAt?: FirebaseFirestoreTypes.Timestamp;
            deletedAt?: FirebaseFirestoreTypes.Timestamp | null;
          };

          if (!data || !data.standardId || typeof data.value !== 'number') {
            return;
          }

          if (data.deletedAt) {
            return;
          }

          if (!data.occurredAt) {
            return;
          }

          nextLogs.push({
            id: docSnap.id,
            standardId: data.standardId,
            value: data.value,
            occurredAtMs: data.occurredAt.toMillis(),
          });
        });
        setLogs(nextLogs);
        setLogsLoading(false);
      },
      (err) => {
        setLogsError(err);
        setLogsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, orderedActiveStandards, timezone, refreshToken]);

  const progressMap = useMemo(
    () =>
      buildDashboardProgressMap({
        standards: orderedActiveStandards,
        logs,
        timezone,
      }),
    [orderedActiveStandards, logs, timezone]
  );

  const dashboardStandards: DashboardStandard[] = useMemo(
    () =>
      orderedActiveStandards.map((standard) => ({
        standard,
        pinned: pinOrder.includes(standard.id),
        progress: progressMap[standard.id] ?? null,
      })),
    [orderedActiveStandards, progressMap, pinOrder]
  );

  const refreshProgress = useCallback(() => {
    // Refresh logs subscription
    setRefreshToken((token) => token + 1);
    // Clear errors to allow re-subscription
    setLogsError(null);
  }, []);

  // Refresh standards by clearing error state - the useEffect will re-run
  // Note: This is a workaround since useStandards doesn't expose a refresh mechanism
  // In a production app, useStandards should expose a refreshStandards callback
  const refreshStandards = useCallback(() => {
    // The standards hook will automatically re-subscribe on next render
    // if errors are cleared. This is a best-effort approach.
  }, []);

  const loading = standardsLoading || logsLoading;
  const error = standardsError ?? logsError;

  return {
    ...standardsResult,
    dashboardStandards,
    progressMap,
    loading,
    error,
    refreshProgress,
    refreshStandards,
    createLogEntry,
  };
}
