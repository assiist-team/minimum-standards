import {
  doc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Unsubscribe,
  Firestore
} from 'firebase/firestore';
import {
  ActivityHistoryDoc,
  ActivityHistoryStandardSnapshot,
  ActivityHistorySource,
  PeriodWindow
} from '@minimum-standards/shared-model';
import { getUserScopedCollections } from './collection-layout';
import { activityHistoryConverter } from './converters';

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
  firestore: Firestore;
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

/**
 * Writes an activityHistory period document.
 * Uses merge: true for idempotency.
 */
export async function writeActivityHistoryPeriod(
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

  const collections = getUserScopedCollections({ firestore, userId });
  const docId = buildActivityHistoryDocId(activityId, standardId, window.startMs);
  const docRef = doc(collections.activityHistory, docId).withConverter(activityHistoryConverter);

  const payload: ActivityHistoryDoc = {
    id: docId,
    activityId,
    standardId,
    periodStartMs: window.startMs,
    periodEndMs: window.endMs,
    periodLabel: window.label,
    periodKey: window.periodKey,
    standardSnapshot,
    total: rollup.total,
    currentSessions: rollup.currentSessions,
    targetSessions: rollup.targetSessions,
    status: rollup.status,
    progressPercent: rollup.progressPercent,
    generatedAtMs: Date.now(),
    source,
  };

  await setDoc(docRef, payload, { merge: true });
}

export interface GetLatestHistoryForStandardParams {
  firestore: Firestore;
  userId: string;
  standardId: string;
}

/**
 * Gets the latest activityHistory document for a standard.
 * Returns null if no history exists.
 */
export async function getLatestHistoryForStandard(
  params: GetLatestHistoryForStandardParams
): Promise<ActivityHistoryDoc | null> {
  const { firestore, userId, standardId } = params;

  const collections = getUserScopedCollections({ firestore, userId });
  const historyQuery = query(
    collections.activityHistory,
    where('standardId', '==', standardId),
    orderBy('periodStartMs', 'desc'),
    limit(1)
  ).withConverter(activityHistoryConverter);

  const snapshot = await getDocs(historyQuery);
  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data();
}

export interface ListenActivityHistoryForActivityParams {
  firestore: Firestore;
  userId: string;
  activityId: string;
  onNext: (docs: ActivityHistoryDoc[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Listens to activityHistory documents for a given activityId.
 * Returns an unsubscribe function.
 * Documents are ordered by periodEndMs desc.
 */
export function listenActivityHistoryForActivity(
  params: ListenActivityHistoryForActivityParams
): Unsubscribe {
  const { firestore, userId, activityId, onNext, onError } = params;

  const collections = getUserScopedCollections({ firestore, userId });
  const historyQuery = query(
    collections.activityHistory,
    where('activityId', '==', activityId),
    orderBy('periodEndMs', 'desc')
  ).withConverter(activityHistoryConverter);

  return onSnapshot(
    historyQuery,
    (snapshot) => {
      const docs: ActivityHistoryDoc[] = [];
      snapshot.forEach((docSnap) => {
        docs.push(docSnap.data());
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

