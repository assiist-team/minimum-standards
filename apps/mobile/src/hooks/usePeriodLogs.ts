import { useEffect, useState } from 'react';
import {
  FirebaseFirestoreTypes,
  collection,
  doc,
  query,
  where,
} from '@react-native-firebase/firestore';
import { firebaseAuth, firebaseFirestore } from '../firebase/firebaseApp';
import { TimestampMs } from '@minimum-standards/shared-model';

export type PeriodLogEntry = {
  id: string;
  value: number;
  occurredAtMs: TimestampMs;
  note: string | null;
  editedAtMs: TimestampMs | null;
};

export interface UsePeriodLogsResult {
  logs: PeriodLogEntry[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch logs for a specific period.
 * Queries logs where occurredAt is within the period window and deletedAt is null.
 *
 * @param standardId - The ID of the standard to fetch logs for
 * @param periodStartMs - Period start timestamp (inclusive)
 * @param periodEndMs - Period end timestamp (exclusive)
 * @returns Logs array, loading state, and error state
 */
export function usePeriodLogs(
  standardId: string | null,
  periodStartMs: TimestampMs | null,
  periodEndMs: TimestampMs | null
): UsePeriodLogsResult {
  const [logs, setLogs] = useState<PeriodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const userId = firebaseAuth.currentUser?.uid;

  useEffect(() => {
    if (!userId || !standardId || periodStartMs === null || periodEndMs === null) {
      setLoading(false);
      setLogs([]);
      return;
    }

    setLoading(true);
    setError(null);

    const logsQuery = query(
      collection(doc(firebaseFirestore, 'users', userId), 'activityLogs'),
      where('standardId', '==', standardId),
      where('occurredAt', '>=', firebaseFirestore.Timestamp.fromMillis(periodStartMs)),
      where('occurredAt', '<', firebaseFirestore.Timestamp.fromMillis(periodEndMs))
    );

    const unsubscribe = logsQuery.onSnapshot(
      (snapshot) => {
        const nextLogs: PeriodLogEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as {
            standardId?: string;
            value?: number;
            occurredAt?: FirebaseFirestoreTypes.Timestamp;
            deletedAt?: FirebaseFirestoreTypes.Timestamp | null;
            note?: string | null;
            editedAt?: FirebaseFirestoreTypes.Timestamp | null;
          };

          if (!data || !data.standardId || typeof data.value !== 'number') {
            return;
          }

          // Exclude soft-deleted logs
          if (data.deletedAt) {
            return;
          }

          if (!data.occurredAt) {
            return;
          }

          nextLogs.push({
            id: docSnap.id,
            value: data.value,
            occurredAtMs: data.occurredAt.toMillis(),
            note: data.note ?? null,
            editedAtMs: data.editedAt?.toMillis() ?? null,
          });
        });

        // Sort by occurredAt descending (most recent first)
        nextLogs.sort((a, b) => b.occurredAtMs - a.occurredAtMs);

        setLogs(nextLogs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, standardId, periodStartMs, periodEndMs]);

  return {
    logs,
    loading,
    error,
  };
}
