import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Standard, standardSchema } from '@minimum-standards/shared-model';

export type FirestoreStandardData = {
  activityId: string;
  minimum: number;
  unit: string;
  cadence: Standard['cadence'];
  state: Standard['state'];
  summary: string;
  sessionConfig: Standard['sessionConfig'];
  quickAddValues?: number[];
  archivedAt: FirebaseFirestoreTypes.Timestamp | null;
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
  updatedAt: FirebaseFirestoreTypes.Timestamp | null;
  deletedAt: FirebaseFirestoreTypes.Timestamp | null;
};

/**
 * Converts a Firestore document (React Native Firebase) into a Standard model
 * using the shared Zod schema for validation/parity.
 */
export function fromFirestoreStandard(
  docId: string,
  data: FirestoreStandardData
): Standard {
  if (!data) {
    throw new Error(`Missing data for standard ${docId}`);
  }

  return standardSchema.parse({
    id: docId,
    activityId: data.activityId,
    minimum: data.minimum,
    unit: data.unit,
    cadence: data.cadence,
    state: data.state,
    summary: data.summary,
    sessionConfig: data.sessionConfig,
    quickAddValues: Array.isArray(data.quickAddValues)
      ? data.quickAddValues.filter(
          (value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0
        )
      : undefined,
    archivedAtMs: data.archivedAt?.toMillis() ?? null,
    createdAtMs: data.createdAt?.toMillis() ?? Date.now(),
    updatedAtMs: data.updatedAt?.toMillis() ?? Date.now(),
    deletedAtMs: data.deletedAt?.toMillis() ?? null,
  });
}
