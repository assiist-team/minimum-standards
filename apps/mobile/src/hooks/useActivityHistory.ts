import { useEffect, useState } from 'react';
import { collection, doc, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { firebaseFirestore } from '../config/firebase';
import { firebaseAuth } from '../config/firebase';

export interface ActivityHistoryRow {
  id: string;
  activityId: string;
  standardId: string;
  periodStartMs: number;
  periodEndMs: number;
  periodLabel: string;
  periodKey?: string;
  standardSnapshot: {
    minimum: number;
    unit: string;
    cadence: { interval: number; unit: 'day' | 'week' | 'month' };
    sessionConfig: {
      sessionsPerCadence: number;
      volumePerSession: number;
      sessionLabel: string;
    };
    summary?: string;
  };
  total: number;
  currentSessions: number;
  targetSessions: number;
  status: 'Met' | 'In Progress' | 'Missed';
  progressPercent: number;
  generatedAtMs: number;
  source: 'boundary' | 'resume';
}

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

    const historyQuery = query(
      collection(doc(firebaseFirestore, 'users', userId), 'activityHistory'),
      where('activityId', '==', activityId),
      orderBy('periodEndMs', 'desc')
    );

    const unsubscribe = onSnapshot(
      historyQuery,
      (snapshot) => {
        const nextRows: ActivityHistoryRow[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          
          if (!data || !data.activityId || !data.standardId) {
            return;
          }

          // Validate required fields
          if (
            typeof data.periodStartMs !== 'number' ||
            typeof data.periodEndMs !== 'number' ||
            !data.periodLabel ||
            !data.standardSnapshot ||
            typeof data.total !== 'number' ||
            typeof data.currentSessions !== 'number' ||
            typeof data.targetSessions !== 'number' ||
            !data.status ||
            typeof data.progressPercent !== 'number'
          ) {
            console.warn(`Invalid activityHistory document ${docSnap.id}: missing required fields`);
            return;
          }

          nextRows.push({
            id: docSnap.id,
            activityId: data.activityId,
            standardId: data.standardId,
            periodStartMs: data.periodStartMs,
            periodEndMs: data.periodEndMs,
            periodLabel: data.periodLabel,
            periodKey: data.periodKey,
            standardSnapshot: data.standardSnapshot,
            total: data.total,
            currentSessions: data.currentSessions,
            targetSessions: data.targetSessions,
            status: data.status,
            progressPercent: data.progressPercent,
            generatedAtMs: data.generatedAtMs ?? Date.now(),
            source: data.source ?? 'boundary',
          });
        });

        setRows(nextRows);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, activityId]);

  return {
    rows,
    loading,
    error,
  };
}

