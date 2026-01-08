import {
  ActivityHistoryDoc,
  ActivityHistoryStandardSnapshot,
  ActivityHistorySource,
  PeriodWindow
} from '@minimum-standards/shared-model';
import {
  CollectionBindings,
  getUserScopedCollections
} from './collection-layout';

/**
 * Builds a deterministic document ID for activityHistory documents.
 * Format: activityId__standardId__periodStartMs
 */
export function buildActivityHistoryDocId(
  activityId: string,
  standardId: string,
  periodStartMs: number
): string {
  return `${activityId}__${standardId}__${periodStartMs}`;
}

export interface WriteActivityHistoryPeriodParams {
  firestore: unknown;
  userId: string;
  activityId: string;
  standardId: string;
  window: PeriodWindow;
  standardSnapshot: ActivityHistoryStandardSnapshot;
  rollup: {
    total: number;
    currentSessions: number;
    targetSessions: number;
    status: 'Met' | 'In Progress' | 'Missed';
    progressPercent: number;
  };
  source: ActivityHistorySource;
}

export interface GetLatestHistoryForStandardParams {
  firestore: unknown;
  userId: string;
  standardId: string;
}

export interface ListenActivityHistoryForActivityParams {
  firestore: unknown;
  userId: string;
  activityId: string;
  onNext: (docs: ActivityHistoryDoc[]) => void;
  onError?: (error: Error) => void;
}

export type Unsubscribe = () => void;

type QuerySnapshotLike = {
  empty: boolean;
  docs: Array<{ id: string; data(): Record<string, unknown> }>;
  forEach(callback: (doc: { id: string; data(): Record<string, unknown> }) => void): void;
};

export type ActivityHistoryFirestoreBindings = CollectionBindings & {
  query: (...args: unknown[]) => unknown;
  where: (...args: unknown[]) => unknown;
  orderBy: (...args: unknown[]) => unknown;
  limit: (...args: unknown[]) => unknown;
  getDocs: (queryRef: unknown) => Promise<QuerySnapshotLike>;
  setDoc: (docRef: unknown, data: ActivityHistoryDoc, options?: { merge?: boolean }) => Promise<void>;
  onSnapshot: (
    queryRef: unknown,
    onNext: (snapshot: QuerySnapshotLike) => void,
    onError?: (error: Error) => void
  ) => Unsubscribe;
};

type RawActivityHistoryDoc = {
  activityId?: string;
  standardId?: string;
  referenceTimestampMs?: number;
  periodStartMs?: number;
  periodEndMs?: number;
  periodLabel?: string;
  periodKey?: string;
  standardSnapshot?: ActivityHistoryStandardSnapshot;
  total?: number;
  currentSessions?: number;
  targetSessions?: number;
  status?: ActivityHistoryDoc['status'];
  progressPercent?: number;
  generatedAtMs?: number;
  source?: ActivityHistorySource;
};

function toActivityHistoryDoc(
  docId: string,
  data: RawActivityHistoryDoc
): ActivityHistoryDoc | null {
  if (
    !data ||
    typeof data.activityId !== 'string' ||
    typeof data.standardId !== 'string' ||
    !data.standardSnapshot ||
    typeof data.total !== 'number' ||
    typeof data.currentSessions !== 'number' ||
    typeof data.targetSessions !== 'number' ||
    typeof data.status !== 'string' ||
    typeof data.progressPercent !== 'number'
  ) {
    return null;
  }

  const referenceTimestamp =
    typeof data.referenceTimestampMs === 'number'
      ? data.referenceTimestampMs
      : typeof data.periodStartMs === 'number'
        ? data.periodStartMs
        : null;

  if (referenceTimestamp == null) {
    return null;
  }

  return {
    id: docId,
    activityId: data.activityId,
    standardId: data.standardId,
    referenceTimestampMs: referenceTimestamp,
    periodStartMs: typeof data.periodStartMs === 'number' ? data.periodStartMs : undefined,
    periodEndMs: typeof data.periodEndMs === 'number' ? data.periodEndMs : undefined,
    periodLabel: typeof data.periodLabel === 'string' ? data.periodLabel : undefined,
    periodKey: typeof data.periodKey === 'string' ? data.periodKey : undefined,
    standardSnapshot: data.standardSnapshot,
    total: data.total,
    currentSessions: data.currentSessions,
    targetSessions: data.targetSessions,
    status: data.status,
    progressPercent: data.progressPercent,
    generatedAtMs: data.generatedAtMs ?? Date.now(),
    source: data.source ?? 'boundary',
  };
}

export function createActivityHistoryHelpers(bindings: ActivityHistoryFirestoreBindings) {
  const {
    collection,
    doc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    setDoc,
    onSnapshot,
  } = bindings;

  async function writeActivityHistoryPeriod(
    params: WriteActivityHistoryPeriodParams
  ): Promise<void> {
    const {
      firestore,
      userId,
      activityId,
      standardId,
      window,
      standardSnapshot,
      rollup,
      source,
    } = params;

    const collections = getUserScopedCollections({
      firestore,
      userId,
      bindings: { collection, doc },
    });
    const docId = buildActivityHistoryDocId(activityId, standardId, window.startMs);
    const docRef = doc(collections.activityHistory, docId);

    const payload: ActivityHistoryDoc = {
      id: docId,
      activityId,
      standardId,
      referenceTimestampMs: window.startMs,
      standardSnapshot,
      total: rollup.total,
      currentSessions: rollup.currentSessions,
      targetSessions: rollup.targetSessions,
      status: rollup.status,
      progressPercent: rollup.progressPercent,
      generatedAtMs: Date.now(),
      source,
    };
    
    // We do not use { merge: true } here because we want to ensure the document 
    // exactly matches our payload, satisfying the strict hasOnlyKeys rules.
    // Overwriting is safe because we compute the complete rollup for the period.
    await setDoc(docRef, payload);
  }

  async function getLatestHistoryForStandard(
    params: GetLatestHistoryForStandardParams
  ): Promise<ActivityHistoryDoc | null> {
    // Runtime validation to catch stale bundle issues early
    // If params is not an object or missing required fields, this indicates a stale bundle
    // or incorrect call signature (positional instead of object parameter)
    if (!params || typeof params !== 'object' || Array.isArray(params)) {
      throw new Error(
        '[getLatestHistoryForStandard] Invalid parameter: expected object with { firestore, userId, standardId }. ' +
        'This error usually indicates a stale JS bundle. ' +
        'See troubleshooting/activity-history-engine-call-error.md for resolution steps.'
      );
    }

    const { firestore, userId, standardId } = params;

    if (!firestore) {
      throw new Error(
        '[getLatestHistoryForStandard] firestore is required but was undefined. ' +
        'This usually indicates a stale JS bundle calling the function with positional arguments. ' +
        'See troubleshooting/activity-history-engine-call-error.md for resolution steps.'
      );
    }

    if (!userId || typeof userId !== 'string') {
      throw new Error(
        `[getLatestHistoryForStandard] userId is required and must be a string, got: ${typeof userId}. ` +
        'This may indicate a stale bundle. See troubleshooting/activity-history-engine-call-error.md'
      );
    }

    if (!standardId || typeof standardId !== 'string') {
      throw new Error(
        `[getLatestHistoryForStandard] standardId is required and must be a string, got: ${typeof standardId}. ` +
        'This may indicate a stale bundle. See troubleshooting/activity-history-engine-call-error.md'
      );
    }

    const collections = getUserScopedCollections({
      firestore,
      userId,
      bindings: { collection, doc },
    });
    const historyQuery = query(
      collections.activityHistory,
      where('standardId', '==', standardId),
      orderBy('referenceTimestampMs', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(historyQuery);
    if (snapshot.empty) {
      return null;
    }

    const raw = snapshot.docs[0].data() as RawActivityHistoryDoc;
    return toActivityHistoryDoc(snapshot.docs[0].id, raw);
  }

  function listenActivityHistoryForActivity(
    params: ListenActivityHistoryForActivityParams
  ): Unsubscribe {
    const { firestore, userId, activityId, onNext, onError } = params;

    const collections = getUserScopedCollections({
      firestore,
      userId,
      bindings: { collection, doc },
    });
    const historyQuery = query(
      collections.activityHistory,
      where('activityId', '==', activityId),
      orderBy('referenceTimestampMs', 'desc')
    );

    return onSnapshot(
      historyQuery,
      (snapshot) => {
        const docs: ActivityHistoryDoc[] = [];
        snapshot.forEach((docSnap) => {
          const parsed = toActivityHistoryDoc(docSnap.id, docSnap.data() as RawActivityHistoryDoc);
          if (parsed) {
            docs.push(parsed);
          }
        });
        onNext(docs);
      },
      (error) => {
        if (onError) {
          onError(error);
        }
      }
    );
  }

  return {
    writeActivityHistoryPeriod,
    getLatestHistoryForStandard,
    listenActivityHistoryForActivity,
  };
}
