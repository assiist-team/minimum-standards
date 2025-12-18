import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from '@react-native-firebase/firestore';
import { firebaseAuth, firebaseFirestore } from '../firebase/firebaseApp';
import {
  Standard,
  StandardCadence,
  StandardSessionConfig,
  formatStandardSummary,
} from '@minimum-standards/shared-model';
import {
  FirestoreStandardData,
  fromFirestoreStandard,
  toFirestoreStandardDelete,
} from '../utils/standardConverter';
import { normalizeFirebaseError } from '../utils/errors';
import { retryFirestoreWrite } from '../utils/retry';

export interface CreateStandardInput {
  activityId: string;
  minimum: number;
  unit: string;
  cadence: StandardCadence;
  sessionConfig: StandardSessionConfig;
}

function buildDefaultQuickAddValues(params: { minimum: number; unit: string }): number[] | undefined {
  const { minimum, unit } = params;
  const normalizedUnit = unit.trim().toLowerCase();

  const countLikeUnits = new Set([
    'session',
    'sessions',
    'call',
    'calls',
    'workout',
    'workouts',
    'rep',
    'reps',
    'time',
    'times',
    'pomodoro',
    'pomodoros',
  ]);

  if (countLikeUnits.has(normalizedUnit) || minimum <= 10) {
    return [1];
  }

  return undefined;
}

export interface CreateLogInput {
  standardId: string;
  value: number;
  occurredAtMs: number;
  note?: string | null;
}

export interface UpdateLogInput {
  logEntryId: string;
  standardId: string;
  value: number;
  occurredAtMs: number;
  note?: string | null;
}

export interface UpdateStandardInput {
  standardId: string;
  activityId: string;
  minimum: number;
  unit: string;
  cadence: StandardCadence;
  sessionConfig: StandardSessionConfig;
}

export interface UseStandardsResult {
  standards: Standard[];
  activeStandards: Standard[];
  archivedStandards: Standard[];
  orderedActiveStandards: Standard[];
  loading: boolean;
  error: Error | null;
  createStandard: (input: CreateStandardInput) => Promise<Standard>;
  updateStandard: (input: UpdateStandardInput) => Promise<Standard>;
  archiveStandard: (standardId: string) => Promise<void>;
  unarchiveStandard: (standardId: string) => Promise<void>;
  deleteStandard: (standardId: string) => Promise<void>;
  createLogEntry: (input: CreateLogInput) => Promise<void>;
  updateLogEntry: (input: UpdateLogInput) => Promise<void>;
  deleteLogEntry: (logEntryId: string, standardId: string) => Promise<void>;
  restoreLogEntry: (logEntryId: string, standardId: string) => Promise<void>;
  canLogStandard: (standardId: string) => boolean;
}

function sortByUpdatedAtDesc(list: Standard[]): Standard[] {
  return [...list].sort((a, b) => b.updatedAtMs - a.updatedAtMs);
}

export function useStandards(): UseStandardsResult {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [standardsLoading, setStandardsLoading] = useState(true);
  const [standardsError, setStandardsError] = useState<Error | null>(null);
  const userId = firebaseAuth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      console.warn('[useStandards] No user ID available - cannot subscribe to standards collection');
      setStandardsLoading(false);
      setStandardsError(new Error('User not authenticated'));
      return;
    }

    console.log('[useStandards] Subscribing to standards collection for user:', userId);
    setStandardsLoading(true);
    setStandardsError(null);

    const standardsQuery = query(
      collection(doc(firebaseFirestore, 'users', userId), 'standards'),
      where('deletedAt', '==', null)
    );

    const unsubscribe = standardsQuery.onSnapshot(
      (snapshot) => {
        try {
          const items: Standard[] = [];
          snapshot.forEach((docSnap) => {
            try {
              items.push(
                fromFirestoreStandard(
                  docSnap.id,
                  docSnap.data() as FirestoreStandardData
                )
              );
            } catch (parseError) {
              console.error(
                `Failed to parse standard ${docSnap.id}`,
                parseError
              );
            }
          });
          setStandards(sortByUpdatedAtDesc(items));
          setStandardsLoading(false);
        } catch (err) {
          setStandardsError(
            err instanceof Error ? err : new Error('Unknown error')
          );
          setStandardsLoading(false);
        }
      },
      (err) => {
        const normalizedError = normalizeFirebaseError(err);
        setStandardsError(normalizedError);
        setStandardsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);


  const activeStandards = useMemo(
    () => standards.filter((standard) => standard.state === 'active'),
    [standards]
  );

  const archivedStandards = useMemo(
    () => standards.filter((standard) => standard.state === 'archived'),
    [standards]
  );

  const orderedActiveStandards = useMemo(
    () => sortByUpdatedAtDesc(activeStandards),
    [activeStandards]
  );

  const createStandard = useCallback(
    async (input: CreateStandardInput): Promise<Standard> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const standardsCollection = collection(
        doc(firebaseFirestore, 'users', userId),
        'standards'
      );

      const docRef = doc(standardsCollection);
      const quickAddValues = buildDefaultQuickAddValues({
        minimum: input.minimum,
        unit: input.unit,
      });

      const payload = {
        activityId: input.activityId,
        minimum: input.minimum,
        unit: input.unit,
        cadence: input.cadence,
        state: 'active',
        summary: formatStandardSummary(
          input.minimum,
          input.unit,
          input.cadence,
          input.sessionConfig
        ),
        sessionConfig: input.sessionConfig,
        ...(quickAddValues ? { quickAddValues } : {}),
        archivedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deletedAt: null,
      };

      await retryFirestoreWrite(async () => {
        await docRef.set(payload);
      });
      const snapshot = await retryFirestoreWrite(async () => {
        return await docRef.get();
      });
      const created = fromFirestoreStandard(
        snapshot.id,
        snapshot.data() as FirestoreStandardData
      );
      return created;
    },
    [userId]
  );

  const updateStandard = useCallback(
    async (input: UpdateStandardInput): Promise<Standard> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const standardRef = doc(
        collection(doc(firebaseFirestore, 'users', userId), 'standards'),
        input.standardId
      );

      const quickAddValues = buildDefaultQuickAddValues({
        minimum: input.minimum,
        unit: input.unit,
      });

      const payload = {
        activityId: input.activityId,
        minimum: input.minimum,
        unit: input.unit,
        cadence: input.cadence,
        summary: formatStandardSummary(
          input.minimum,
          input.unit,
          input.cadence,
          input.sessionConfig
        ),
        sessionConfig: input.sessionConfig,
        ...(quickAddValues ? { quickAddValues } : {}),
        updatedAt: serverTimestamp(),
      };

      await retryFirestoreWrite(async () => {
        await standardRef.update(payload);
      });
      const snapshot = await retryFirestoreWrite(async () => {
        return await standardRef.get();
      });
      const updated = fromFirestoreStandard(
        snapshot.id,
        snapshot.data() as FirestoreStandardData
      );
      return updated;
    },
    [userId]
  );

  const updateArchiveState = useCallback(
    async (standardId: string, shouldArchive: boolean): Promise<void> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const standardRef = doc(
        collection(doc(firebaseFirestore, 'users', userId), 'standards'),
        standardId
      );

      await retryFirestoreWrite(async () => {
        await standardRef.update({
          state: shouldArchive ? 'archived' : 'active',
          archivedAt: shouldArchive
            ? serverTimestamp()
            : null,
          updatedAt: serverTimestamp(),
        });
      });
    },
    [userId]
  );

  const archiveStandard = useCallback(
    async (standardId: string) => updateArchiveState(standardId, true),
    [updateArchiveState]
  );

  const unarchiveStandard = useCallback(
    async (standardId: string) => updateArchiveState(standardId, false),
    [updateArchiveState]
  );

  const deleteStandard = useCallback(
    async (standardId: string): Promise<void> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const standardRef = doc(
        collection(doc(firebaseFirestore, 'users', userId), 'standards'),
        standardId
      );

      // Optimistic update: remove from list
      const standardToDelete = standards.find((s) => s.id === standardId);
      setStandards((prev) => prev.filter((s) => s.id !== standardId));

      try {
        // Soft delete by setting deletedAt
        const firestoreData = toFirestoreStandardDelete();
        await retryFirestoreWrite(async () => {
          await standardRef.update(firestoreData);
        });
      } catch (err) {
        // Rollback: restore standard
        if (standardToDelete) {
          setStandards((prev) => {
            const updated = [...prev, standardToDelete];
            return sortByUpdatedAtDesc(updated);
          });
        }
        throw err;
      }
    },
    [userId, standards]
  );

  const canLogStandard = useCallback(
    (standardId: string): boolean => {
      const standard = standards.find((item) => item.id === standardId);
      if (!standard) {
        return false;
      }
      return standard.state === 'active' && standard.archivedAtMs == null;
    },
    [standards]
  );

  const createLogEntry = useCallback(
    async ({ standardId, value, occurredAtMs, note = null }: CreateLogInput) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const target = standards.find((standard) => standard.id === standardId);
      if (!target) {
        throw new Error('Standard not found');
      }
      if (!canLogStandard(standardId)) {
        throw new Error(
          'This Standard is inactive. Activate it to resume logging.'
        );
      }

      const logsRef = doc(
        collection(doc(firebaseFirestore, 'users', userId), 'activityLogs')
      );

      await retryFirestoreWrite(async () => {
        await logsRef.set({
          standardId,
          value,
          occurredAt: Timestamp.fromMillis(occurredAtMs),
          note,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          editedAt: null,
          deletedAt: null,
        });
      });
    },
    [userId, standards, canLogStandard]
  );

  const updateLogEntry = useCallback(
    async ({ logEntryId, standardId, value, occurredAtMs, note = null }: UpdateLogInput) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!canLogStandard(standardId)) {
        throw new Error(
          'This Standard is inactive. Activate it to edit logs.'
        );
      }

      const logRef = doc(
        collection(doc(firebaseFirestore, 'users', userId), 'activityLogs'),
        logEntryId
      );

      await retryFirestoreWrite(async () => {
        await logRef.update({
          value,
          occurredAt: Timestamp.fromMillis(occurredAtMs),
          note,
          editedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    },
    [userId, canLogStandard]
  );

  const deleteLogEntry = useCallback(
    async (logEntryId: string, standardId: string) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!canLogStandard(standardId)) {
        throw new Error(
          'This Standard is inactive. Activate it to delete logs.'
        );
      }

      const logRef = doc(
        collection(doc(firebaseFirestore, 'users', userId), 'activityLogs'),
        logEntryId
      );

      await retryFirestoreWrite(async () => {
        await logRef.update({
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    },
    [userId, canLogStandard]
  );

  const restoreLogEntry = useCallback(
    async (logEntryId: string, standardId: string) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!canLogStandard(standardId)) {
        throw new Error(
          'This Standard is inactive. Activate it to restore logs.'
        );
      }

      const logRef = doc(
        collection(doc(firebaseFirestore, 'users', userId), 'activityLogs'),
        logEntryId
      );

      await retryFirestoreWrite(async () => {
        await logRef.update({
          deletedAt: null,
          updatedAt: serverTimestamp(),
        });
      });
    },
    [userId, canLogStandard]
  );

  const loading = standardsLoading;
  const error = standardsError;

  return {
    standards,
    activeStandards,
    archivedStandards,
    orderedActiveStandards,
    loading,
    error,
    createStandard,
    updateStandard,
    archiveStandard,
    unarchiveStandard,
    deleteStandard,
    createLogEntry,
    updateLogEntry,
    deleteLogEntry,
    restoreLogEntry,
    canLogStandard,
  };
}
