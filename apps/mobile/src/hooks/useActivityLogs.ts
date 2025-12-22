import { useEffect, useState } from 'react';
import { collection, doc, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { firebaseFirestore } from '../config/firebase';
import { firebaseAuth } from '../config/firebase';

export interface ActivityLogSlice {
  id: string;
  standardId: string;
  value: number;
  occurredAtMs: number;
}

export interface UseActivityLogsResult {
  logs: ActivityLogSlice[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch all logs for standards that reference a given activityId.
 * This is used to compute synthetic current period rows.
 */
export function useActivityLogs(activityId: string | null, standardIds: string[]): UseActivityLogsResult {
  const [logs, setLogs] = useState<ActivityLogSlice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const userId = firebaseAuth.currentUser?.uid;

  useEffect(() => {
    if (!userId || !activityId || standardIds.length === 0) {
      setLoading(false);
      setLogs([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Create a Set for efficient lookup
    const standardIdSet = new Set(standardIds);

    // Query all logs (we'll filter by standardId client-side to avoid Firestore 'in' query limit of 10)
    // For efficiency, we could add a time filter, but for now we query all logs
    // since we need them for computing current period totals
    const logsQuery = query(
      collection(doc(firebaseFirestore, 'users', userId), 'activityLogs')
    );

    const unsubscribe = onSnapshot(
      logsQuery,
      (snapshot) => {
        const nextLogs: ActivityLogSlice[] = [];
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

          // Exclude soft-deleted logs
          if (data.deletedAt) {
            return;
          }

          if (!data.occurredAt) {
            return;
          }

          // Only include logs for standards that reference this activity
          if (!standardIdSet.has(data.standardId)) {
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
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, activityId, standardIds.join(',')]); // Use join to create stable dependency

  return {
    logs,
    loading,
    error,
  };
}

