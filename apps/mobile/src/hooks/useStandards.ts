import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {
  Standard,
  StandardCadence,
  DashboardPins,
  formatStandardSummary,
} from '@minimum-standards/shared-model';
import {
  FirestoreStandardData,
  fromFirestoreStandard,
} from '../utils/standardConverter';
import {
  buildOrderedStandards,
  movePinToIndex,
  sanitizePinOrder,
  togglePin,
} from '../utils/dashboardPins';

export interface CreateStandardInput {
  activityId: string;
  minimum: number;
  unit: string;
  cadence: StandardCadence;
  isArchived: boolean;
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

export interface UseStandardsResult {
  standards: Standard[];
  activeStandards: Standard[];
  archivedStandards: Standard[];
  pinnedStandards: Standard[];
  orderedActiveStandards: Standard[];
  pinOrder: string[];
  loading: boolean;
  error: Error | null;
  createStandard: (input: CreateStandardInput) => Promise<Standard>;
  archiveStandard: (standardId: string) => Promise<void>;
  unarchiveStandard: (standardId: string) => Promise<void>;
  createLogEntry: (input: CreateLogInput) => Promise<void>;
  updateLogEntry: (input: UpdateLogInput) => Promise<void>;
  deleteLogEntry: (logEntryId: string, standardId: string) => Promise<void>;
  restoreLogEntry: (logEntryId: string, standardId: string) => Promise<void>;
  canLogStandard: (standardId: string) => boolean;
  pinStandard: (standardId: string) => Promise<void>;
  unpinStandard: (standardId: string) => Promise<void>;
  movePinnedStandard: (standardId: string, targetIndex: number) => Promise<void>;
}

function sortByUpdatedAtDesc(list: Standard[]): Standard[] {
  return [...list].sort((a, b) => b.updatedAtMs - a.updatedAtMs);
}

type DashboardPinsState = Pick<DashboardPins, 'pinnedStandardIds'> & {
  updatedAtMs: number;
};

type DashboardPinsDoc = {
  pinnedStandardIds?: string[];
  updatedAt?: FirebaseFirestoreTypes.Timestamp | null;
};

const DASHBOARD_PINS_DOC_ID = 'dashboardPins';
const EMPTY_PINS_STATE: DashboardPinsState = {
  pinnedStandardIds: [],
  updatedAtMs: 0,
};

export function useStandards(): UseStandardsResult {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [standardsLoading, setStandardsLoading] = useState(true);
  const [standardsError, setStandardsError] = useState<Error | null>(null);
  const [pinState, setPinState] = useState<DashboardPinsState>({
    pinnedStandardIds: [],
    updatedAtMs: Date.now(),
  });
  const pinStateRef = useRef(pinState);
  const [pinsLoading, setPinsLoading] = useState(true);
  const [pinsError, setPinsError] = useState<Error | null>(null);
  const userId = auth().currentUser?.uid;

  useEffect(() => {
    pinStateRef.current = pinState;
  }, [pinState]);

  const dashboardPinsRef = useMemo(() => {
    if (!userId) {
      return null;
    }
    return firestore()
      .collection('users')
      .doc(userId)
      .collection('preferences')
      .doc(DASHBOARD_PINS_DOC_ID);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setStandardsLoading(false);
      setStandardsError(new Error('User not authenticated'));
      return;
    }

    setStandardsLoading(true);
    setStandardsError(null);

    const standardsQuery = firestore()
      .collection('users')
      .doc(userId)
      .collection('standards')
      .where('deletedAt', '==', null);

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
        setStandardsError(err);
        setStandardsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!dashboardPinsRef) {
      setPinsLoading(false);
      setPinState(EMPTY_PINS_STATE);
      return;
    }

    setPinsLoading(true);
    setPinsError(null);

    const unsubscribe = dashboardPinsRef.onSnapshot(
      (snapshot) => {
        if (!snapshot.exists) {
          dashboardPinsRef
            .set({
              pinnedStandardIds: [],
              updatedAt: firestore.FieldValue.serverTimestamp(),
            })
            .catch((err) => {
              setPinsError(err);
            })
            .finally(() => setPinsLoading(false));
          return;
        }

        const data = snapshot.data() as DashboardPinsDoc;
        setPinState({
          pinnedStandardIds: Array.isArray(data.pinnedStandardIds)
            ? data.pinnedStandardIds.filter(
                (id): id is string => typeof id === 'string'
              )
            : [],
          updatedAtMs: data.updatedAt?.toMillis() ?? Date.now(),
        });
        setPinsLoading(false);
      },
      (err) => {
        setPinsError(err);
        setPinsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [dashboardPinsRef]);

  const activeStandards = useMemo(
    () => standards.filter((standard) => standard.state === 'active'),
    [standards]
  );

  const archivedStandards = useMemo(
    () => standards.filter((standard) => standard.state === 'archived'),
    [standards]
  );

  const { pinnedStandards, orderedActiveStandards } = useMemo(
    () => buildOrderedStandards(activeStandards, pinState.pinnedStandardIds),
    [activeStandards, pinState.pinnedStandardIds]
  );

  useEffect(() => {
    if (
      !dashboardPinsRef ||
      pinState.pinnedStandardIds.length === 0 ||
      activeStandards.length === 0
    ) {
      return;
    }

    const sanitized = sanitizePinOrder(
      pinState.pinnedStandardIds,
      activeStandards
    );
    if (sanitized.length === pinState.pinnedStandardIds.length) {
      return;
    }

    dashboardPinsRef
      .set(
        {
          pinnedStandardIds: sanitized,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      .catch((err) => setPinsError(err));
  }, [dashboardPinsRef, pinState.pinnedStandardIds, activeStandards]);

  const createStandard = useCallback(
    async (input: CreateStandardInput): Promise<Standard> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const standardsCollection = firestore()
        .collection('users')
        .doc(userId)
        .collection('standards');

      const docRef = standardsCollection.doc();
      const isArchived = input.isArchived;
      const quickAddValues = buildDefaultQuickAddValues({
        minimum: input.minimum,
        unit: input.unit,
      });

      const payload = {
        activityId: input.activityId,
        minimum: input.minimum,
        unit: input.unit,
        cadence: input.cadence,
        state: isArchived ? 'archived' : 'active',
        summary: formatStandardSummary(
          input.minimum,
          input.unit,
          input.cadence
        ),
        ...(quickAddValues ? { quickAddValues } : {}),
        archivedAt: isArchived ? firestore.FieldValue.serverTimestamp() : null,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        deletedAt: null,
      };

      await docRef.set(payload);
      const snapshot = await docRef.get();
      const created = fromFirestoreStandard(
        snapshot.id,
        snapshot.data() as FirestoreStandardData
      );
      return created;
    },
    [userId]
  );

  const updateArchiveState = useCallback(
    async (standardId: string, shouldArchive: boolean): Promise<void> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const standardRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('standards')
        .doc(standardId);

      await standardRef.update({
        state: shouldArchive ? 'archived' : 'active',
        archivedAt: shouldArchive
          ? firestore.FieldValue.serverTimestamp()
          : null,
        updatedAt: firestore.FieldValue.serverTimestamp(),
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
          'This Standard is archived. Unarchive it to resume logging.'
        );
      }

      const logsRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('activityLogs')
        .doc();

      await logsRef.set({
        standardId,
        value,
        occurredAt: firestore.Timestamp.fromMillis(occurredAtMs),
        note,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        editedAt: null,
        deletedAt: null,
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
          'This Standard is archived. Unarchive it to edit logs.'
        );
      }

      const logRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('activityLogs')
        .doc(logEntryId);

      await logRef.update({
        value,
        occurredAt: firestore.Timestamp.fromMillis(occurredAtMs),
        note,
        editedAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
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
          'This Standard is archived. Unarchive it to delete logs.'
        );
      }

      const logRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('activityLogs')
        .doc(logEntryId);

      await logRef.update({
        deletedAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
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
          'This Standard is archived. Unarchive it to restore logs.'
        );
      }

      const logRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('activityLogs')
        .doc(logEntryId);

      await logRef.update({
        deletedAt: null,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    },
    [userId, canLogStandard]
  );

  const persistPins = useCallback(
    async (nextOrder: string[]) => {
      if (!dashboardPinsRef) {
        throw new Error('User not authenticated');
      }
      await dashboardPinsRef.set(
        {
          pinnedStandardIds: nextOrder,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    },
    [dashboardPinsRef]
  );

  const pinStandard = useCallback(
    async (standardId: string) => {
      if (!dashboardPinsRef) {
        throw new Error('User not authenticated');
      }

      let nextOrder: string[] = pinStateRef.current.pinnedStandardIds;
      setPinState((prev) => {
        nextOrder = togglePin(prev.pinnedStandardIds, standardId, true);
        return { ...prev, pinnedStandardIds: nextOrder, updatedAtMs: Date.now() };
      });

      try {
        await persistPins(nextOrder);
      } catch (err) {
        setPinsError(err instanceof Error ? err : new Error('Pin failed'));
        throw err;
      }
    },
    [dashboardPinsRef, persistPins]
  );

  const unpinStandard = useCallback(
    async (standardId: string) => {
      if (!dashboardPinsRef) {
        throw new Error('User not authenticated');
      }

      let nextOrder: string[] = pinStateRef.current.pinnedStandardIds;
      setPinState((prev) => {
        nextOrder = togglePin(prev.pinnedStandardIds, standardId, false);
        return { ...prev, pinnedStandardIds: nextOrder, updatedAtMs: Date.now() };
      });

      try {
        await persistPins(nextOrder);
      } catch (err) {
        setPinsError(err instanceof Error ? err : new Error('Unpin failed'));
        throw err;
      }
    },
    [dashboardPinsRef, persistPins]
  );

  const movePinnedStandard = useCallback(
    async (standardId: string, targetIndex: number) => {
      if (!dashboardPinsRef) {
        throw new Error('User not authenticated');
      }

      let nextOrder: string[] = pinStateRef.current.pinnedStandardIds;
      setPinState((prev) => {
        nextOrder = movePinToIndex(prev.pinnedStandardIds, standardId, targetIndex);
        return { ...prev, pinnedStandardIds: nextOrder, updatedAtMs: Date.now() };
      });

      try {
        await persistPins(nextOrder);
      } catch (err) {
        setPinsError(err instanceof Error ? err : new Error('Reorder failed'));
        throw err;
      }
    },
    [dashboardPinsRef, persistPins]
  );

  const loading = standardsLoading || pinsLoading;
  const error = standardsError ?? pinsError;

  return {
    standards,
    activeStandards,
    archivedStandards,
    pinnedStandards,
    orderedActiveStandards,
    pinOrder: pinState.pinnedStandardIds,
    loading,
    error,
    createStandard,
    archiveStandard,
    unarchiveStandard,
    createLogEntry,
    updateLogEntry,
    deleteLogEntry,
    restoreLogEntry,
    canLogStandard,
    pinStandard,
    unpinStandard,
    movePinnedStandard,
  };
}
