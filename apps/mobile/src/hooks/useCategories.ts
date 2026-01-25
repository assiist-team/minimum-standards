import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from '@react-native-firebase/firestore';
import { firebaseAuth, firebaseFirestore } from '../firebase/firebaseApp';
import { Category, UNCATEGORIZED_CATEGORY_ID } from '@minimum-standards/shared-model';
import {
  fromFirestoreCategory,
  toFirestoreCategory,
  toFirestoreCategoryUpdate,
  toFirestoreCategoryDelete,
} from '../utils/categoryConverter';
import { normalizeFirebaseError } from '../utils/errors';
import { retryFirestoreWrite } from '../utils/retry';

export interface UseCategoriesResult {
  categories: Category[]; // All categories excluding soft-deleted
  orderedCategories: Category[]; // Categories sorted by order
  loading: boolean;
  error: Error | null;
  createCategory: (input: { name: string }) => Promise<Category>;
  renameCategory: (categoryId: string, input: { name: string }) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  reorderCategories: (nextOrderedIds: string[]) => Promise<void>;
  ensureSystemCategories: () => Promise<void>;
}

/**
 * Hook to manage Categories collection with CRUD operations and ordering.
 * 
 * Features:
 * - Real-time subscription to user's categories collection
 * - Filters out soft-deleted categories
 * - Ensures Uncategorized category exists
 * - CRUD operations with optimistic updates
 * - Reordering support
 */
export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [systemCategoriesEnsured, setSystemCategoriesEnsured] = useState(false);

  const userId = firebaseAuth.currentUser?.uid;

  // Ensure Uncategorized category exists
  const ensureSystemCategories = useCallback(async () => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const uncategorizedRef = doc(
      collection(doc(firebaseFirestore, 'users', userId), 'categories'),
      UNCATEGORIZED_CATEGORY_ID
    );

    try {
      const snapshot = await uncategorizedRef.get();
      if (!snapshot.exists) {
        // Create Uncategorized category
        const uncategorizedCategory: Omit<Category, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'> = {
          name: 'Uncategorized',
          order: 0,
          isSystem: true,
        };
        await retryFirestoreWrite(async () => {
          await uncategorizedRef.set(toFirestoreCategory(uncategorizedCategory));
        });
      }
    } catch (err) {
      console.error('[useCategories] Failed to ensure system categories:', err);
      // Don't throw - this is best-effort
    }
  }, [userId]);

  // Subscribe to categories collection
  useEffect(() => {
    if (!userId) {
      console.warn('[useCategories] No user ID available - cannot subscribe to categories collection');
      setLoading(false);
      setError(new Error('User not authenticated'));
      return;
    }

    console.log('[useCategories] Subscribing to categories collection for user:', userId);
    setLoading(true);
    setError(null);

    const categoriesQuery = query(
      collection(doc(firebaseFirestore, 'users', userId), 'categories'),
      where('deletedAt', '==', null)
    );

    const unsubscribe = categoriesQuery.onSnapshot(
      (snapshot) => {
        try {
          const items: Category[] = [];
          snapshot.forEach((docSnap) => {
            try {
              items.push(
                fromFirestoreCategory(
                  docSnap.id,
                  docSnap.data() as any
                )
              );
            } catch (parseError) {
              console.error(
                `Failed to parse category ${docSnap.id}`,
                parseError
              );
            }
          });
          setCategories(items);
          setLoading(false);

          // Ensure system categories exist after first snapshot
          if (!systemCategoriesEnsured) {
            ensureSystemCategories();
            setSystemCategoriesEnsured(true);
          }
        } catch (err) {
          setError(
            err instanceof Error ? err : new Error('Unknown error')
          );
          setLoading(false);
        }
      },
      (err) => {
        const normalizedError = normalizeFirebaseError(err);
        setError(normalizedError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, systemCategoriesEnsured, ensureSystemCategories]);

  // Ordered categories sorted by order field
  const orderedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.order - b.order);
  }, [categories]);

  // Create category
  const createCategory = useCallback(
    async (input: { name: string }): Promise<Category> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const categoriesCollection = collection(
        doc(firebaseFirestore, 'users', userId),
        'categories'
      );

      // Find max order to append at end
      const maxOrder = categories.length > 0
        ? Math.max(...categories.map(c => c.order))
        : -1;

      const docRef = doc(categoriesCollection);
      const newCategory: Omit<Category, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'> = {
        name: input.name.trim(),
        order: maxOrder + 1,
        isSystem: false,
      };

      // Optimistic update
      const optimisticCategory: Category = {
        id: docRef.id,
        ...newCategory,
        createdAtMs: Date.now(),
        updatedAtMs: Date.now(),
        deletedAtMs: null,
      };
      setCategories((prev) => [...prev, optimisticCategory]);

      try {
        await retryFirestoreWrite(async () => {
          await docRef.set(toFirestoreCategory(newCategory));
        });

        const snapshot = await retryFirestoreWrite(async () => {
          return await docRef.get();
        });
        const created = fromFirestoreCategory(
          snapshot.id,
          snapshot.data() as any
        );

        // Replace optimistic with real
        setCategories((prev) =>
          prev.map((c) => (c.id === docRef.id ? created : c))
        );

        return created;
      } catch (err) {
        // Rollback optimistic update
        setCategories((prev) => prev.filter((c) => c.id !== docRef.id));
        throw err;
      }
    },
    [userId, categories]
  );

  // Rename category
  const renameCategory = useCallback(
    async (categoryId: string, input: { name: string }): Promise<void> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const category = categories.find((c) => c.id === categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      if (category.isSystem) {
        throw new Error('Cannot rename system category');
      }

      const categoryRef = doc(
        collection(doc(firebaseFirestore, 'users', userId), 'categories'),
        categoryId
      );

      // Optimistic update
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, name: input.name.trim() } : c
        )
      );

      try {
        await retryFirestoreWrite(async () => {
          await categoryRef.update(
            toFirestoreCategoryUpdate({ name: input.name.trim() })
          );
        });

        // Refresh from server
        const snapshot = await retryFirestoreWrite(async () => {
          return await categoryRef.get();
        });
        const updated = fromFirestoreCategory(
          snapshot.id,
          snapshot.data() as any
        );
        setCategories((prev) =>
          prev.map((c) => (c.id === categoryId ? updated : c))
        );
      } catch (err) {
        // Rollback optimistic update
        setCategories((prev) =>
          prev.map((c) => (c.id === categoryId ? category : c))
        );
        throw err;
      }
    },
    [userId, categories]
  );

  // Delete category (soft delete)
  const deleteCategory = useCallback(
    async (categoryId: string): Promise<void> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const category = categories.find((c) => c.id === categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      if (category.isSystem) {
        throw new Error('Cannot delete system category');
      }

      const categoryRef = doc(
        collection(doc(firebaseFirestore, 'users', userId), 'categories'),
        categoryId
      );

      // Optimistic update
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));

      try {
        await retryFirestoreWrite(async () => {
          await categoryRef.update(toFirestoreCategoryDelete());
        });
      } catch (err) {
        // Rollback optimistic update
        if (category) {
          setCategories((prev) => [...prev, category]);
        }
        throw err;
      }
    },
    [userId, categories]
  );

  // Reorder categories
  const reorderCategories = useCallback(
    async (nextOrderedIds: string[]): Promise<void> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Validate all IDs exist
      const categoryMap = new Map(categories.map((c) => [c.id, c]));
      for (const id of nextOrderedIds) {
        if (!categoryMap.has(id)) {
          throw new Error(`Category ${id} not found`);
        }
      }

      // Optimistic update
      const reordered = nextOrderedIds.map((id, index) => ({
        ...categoryMap.get(id)!,
        order: index,
      }));
      setCategories((prev) => {
        const remaining = prev.filter((c) => !nextOrderedIds.includes(c.id));
        return [...reordered, ...remaining];
      });

      try {
        const batch = writeBatch(firebaseFirestore);
        nextOrderedIds.forEach((id, index) => {
          const categoryRef = doc(
            collection(doc(firebaseFirestore, 'users', userId), 'categories'),
            id
          );
          batch.update(
            categoryRef,
            toFirestoreCategoryUpdate({ order: index })
          );
        });

        await retryFirestoreWrite(async () => {
          await batch.commit();
        });

        // Refresh from server
        const refreshed = await Promise.all(
          nextOrderedIds.map(async (id) => {
            const categoryRef = doc(
              collection(doc(firebaseFirestore, 'users', userId), 'categories'),
              id
            );
            const snapshot = await categoryRef.get();
            return fromFirestoreCategory(snapshot.id, snapshot.data() as any);
          })
        );
        setCategories((prev) => {
          const remaining = prev.filter((c) => !nextOrderedIds.includes(c.id));
          return [...refreshed, ...remaining];
        });
      } catch (err) {
        // Rollback optimistic update
        setCategories((prev) => {
          const reorderedMap = new Map(
            nextOrderedIds.map((id, index) => [id, index])
          );
          return prev.map((c) => {
            const newOrder = reorderedMap.get(c.id);
            if (newOrder !== undefined) {
              return { ...c, order: categoryMap.get(c.id)!.order };
            }
            return c;
          });
        });
        throw err;
      }
    },
    [userId, categories]
  );

  return {
    categories,
    orderedCategories,
    loading,
    error,
    createCategory,
    renameCategory,
    deleteCategory,
    reorderCategories,
    ensureSystemCategories,
  };
}

