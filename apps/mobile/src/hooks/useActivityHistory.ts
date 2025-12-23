import { useEffect, useState } from 'react';
import { ActivityHistoryDoc } from '@minimum-standards/shared-model';
import { firebaseAuth } from '../firebase/firebaseApp';
import { listenActivityHistoryForActivity } from '../utils/activityHistoryFirestore';

export type ActivityHistoryRow = ActivityHistoryDoc;

export interface UseActivityHistoryResult {
  rows: ActivityHistoryRow[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch persisted activityHistory rows for a given activityId.
 * Queries activityHistory where activityId == X orderBy periodEndMs desc.
 */
export function useActivityHistory(activityId: string | null): UseActivityHistoryResult {
  const [rows, setRows] = useState<ActivityHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const userId = firebaseAuth.currentUser?.uid;

  useEffect(() => {
    if (!userId || !activityId) {
      setLoading(false);
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = listenActivityHistoryForActivity({
      userId,
      activityId,
      onNext: (docs) => {
        setRows(docs);
        setLoading(false);
      },
      onError: (err) => {
        setError(err);
        setLoading(false);
      },
    });

    return () => unsubscribe();
  }, [userId, activityId]);

  return {
    rows,
    loading,
    error,
  };
}

