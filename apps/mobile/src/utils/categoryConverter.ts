import { Category, categorySchema, UNCATEGORIZED_CATEGORY_ID } from '@minimum-standards/shared-model';
import { FirebaseFirestoreTypes, serverTimestamp, Timestamp } from '@react-native-firebase/firestore';

type FirestoreCategoryData = {
  name: string;
  order: number;
  isSystem?: boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
  updatedAt: FirebaseFirestoreTypes.Timestamp | null;
  deletedAt: FirebaseFirestoreTypes.Timestamp | null;
};

/**
 * Converts a React Native Firebase Firestore document to a Category model.
 */
export function fromFirestoreCategory(
  docId: string,
  data: FirestoreCategoryData
): Category {
  return categorySchema.parse({
    id: docId,
    name: data.name,
    order: data.order,
    isSystem: data.isSystem ?? false,
    createdAtMs: data.createdAt?.toMillis() ?? Date.now(),
    updatedAtMs: data.updatedAt?.toMillis() ?? Date.now(),
    deletedAtMs: data.deletedAt?.toMillis() ?? null,
  });
}

/**
 * Converts a Category model to Firestore data format for React Native Firebase.
 * Note: createdAt and updatedAt should use serverTimestamp() when writing.
 */
export function toFirestoreCategory(
  category: Omit<Category, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'>
): Omit<FirestoreCategoryData, 'createdAt' | 'updatedAt'> & {
  createdAt: FirebaseFirestoreTypes.FieldValue;
  updatedAt: FirebaseFirestoreTypes.FieldValue;
  deletedAt: FirebaseFirestoreTypes.Timestamp | null;
} {
  return {
    name: category.name,
    order: category.order,
    isSystem: category.isSystem ?? false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  };
}

/**
 * Converts Category updates to Firestore update format.
 */
export function toFirestoreCategoryUpdate(
  updates: Partial<Omit<Category, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'>>
): Partial<FirestoreCategoryData> & {
  updatedAt: FirebaseFirestoreTypes.FieldValue;
} {
  const result: any = {
    updatedAt: serverTimestamp(),
  };

  if (updates.name !== undefined) {
    result.name = updates.name;
  }
  if (updates.order !== undefined) {
    result.order = updates.order;
  }
  if (updates.isSystem !== undefined) {
    result.isSystem = updates.isSystem;
  }

  return result;
}

/**
 * Converts Category soft delete to Firestore update format.
 */
export function toFirestoreCategoryDelete(): {
  deletedAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.FieldValue;
} {
  return {
    deletedAt: Timestamp.now(),
    updatedAt: serverTimestamp(),
  };
}

export { UNCATEGORIZED_CATEGORY_ID };
