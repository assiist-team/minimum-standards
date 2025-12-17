import { Activity, activitySchema } from '@minimum-standards/shared-model';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import firestoreModule from '@react-native-firebase/firestore';

const FieldValue = firestoreModule.FieldValue;
const Timestamp = firestoreModule.Timestamp;

type FirestoreActivityData = {
  name: string;
  unit: string;
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
  updatedAt: FirebaseFirestoreTypes.Timestamp | null;
  deletedAt: FirebaseFirestoreTypes.Timestamp | null;
};

/**
 * Converts a React Native Firebase Firestore document to an Activity model.
 */
export function fromFirestoreActivity(
  docId: string,
  data: FirestoreActivityData
): Activity {
  return activitySchema.parse({
    id: docId,
    name: data.name,
    unit: data.unit,
    createdAtMs: data.createdAt?.toMillis() ?? Date.now(),
    updatedAtMs: data.updatedAt?.toMillis() ?? Date.now(),
    deletedAtMs: data.deletedAt?.toMillis() ?? null,
  });
}

/**
 * Converts an Activity model to Firestore data format for React Native Firebase.
 * Note: createdAt and updatedAt should use FieldValue.serverTimestamp() when writing.
 */
export function toFirestoreActivity(
  activity: Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'>
): Omit<FirestoreActivityData, 'createdAt' | 'updatedAt'> & {
  createdAt: FirebaseFirestoreTypes.FieldValue;
  updatedAt: FirebaseFirestoreTypes.FieldValue;
  deletedAt: FirebaseFirestoreTypes.Timestamp | null;
} {
  return {
    name: activity.name,
    unit: activity.unit, // Already normalized via schema transform
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    deletedAt: null,
  };
}

/**
 * Converts Activity updates to Firestore update format.
 */
export function toFirestoreActivityUpdate(
  updates: Partial<Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'>>
): Partial<FirestoreActivityData> & {
  updatedAt: FirebaseFirestoreTypes.FieldValue;
} {
  const result: any = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (updates.name !== undefined) {
    result.name = updates.name;
  }
  if (updates.unit !== undefined) {
    result.unit = updates.unit;
  }

  return result;
}

/**
 * Converts Activity soft delete to Firestore update format.
 */
export function toFirestoreActivityDelete(): {
  deletedAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.FieldValue;
} {
  return {
    deletedAt: Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}
