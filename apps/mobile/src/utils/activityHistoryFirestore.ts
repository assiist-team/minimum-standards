import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from '@react-native-firebase/firestore';
import { firebaseFirestore, firebaseAuth } from '../firebase/firebaseApp';
import { Standard, PeriodWindow } from '@minimum-standards/shared-model';
import { ActivityHistoryRow } from '../hooks/useActivityHistory';

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

/**
 * Writes an activityHistory period document.
 * Uses merge: true for idempotency.
 */
export async function writeActivityHistoryPeriod(params: {
  userId: string;
  activityId: string;
  standardId: string;
  window: PeriodWindow;
  standardSnapshot: ActivityHistoryRow['standardSnapshot'];
  rollup: {
    total: number;
    currentSessions: number;
    targetSessions: number;
    status: 'Met' | 'In Progress' | 'Missed';
    progressPercent: number;
  };
  source: 'boundary' | 'resume';
}): Promise<void> {
  const {
    userId,
    activityId,
    standardId,
    window,
    standardSnapshot,
    rollup,
    source,
  } = params;

  const docId = buildActivityHistoryDocId(activityId, standardId, window.startMs);
  const docRef = doc(
    collection(doc(firebaseFirestore, 'users', userId), 'activityHistory'),
    docId
  );

  const payload = {
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

  await docRef.set(payload, { merge: true });
}

/**
 * Gets the latest activityHistory document for a standard.
 * Returns null if no history exists.
 */
export async function getLatestHistoryForStandard(
  userId: string,
  standardId: string
): Promise<ActivityHistoryRow | null> {
  const historyQuery = query(
    collection(doc(firebaseFirestore, 'users', userId), 'activityHistory'),
    where('standardId', '==', standardId),
    orderBy('periodStartMs', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(historyQuery);
  if (snapshot.empty) {
    return null;
  }

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();

  // Validate required fields
  if (
    !data ||
    !data.activityId ||
    !data.standardId ||
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
    return null;
  }

  return {
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
  };
}

