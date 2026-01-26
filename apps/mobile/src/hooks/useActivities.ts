import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  collection,
  doc,
  query,
  serverTimestamp,
  where,
} from '@react-native-firebase/firestore';
import { firebaseAuth, firebaseFirestore } from '../firebase/firebaseApp';
import { Activity } from '@minimum-standards/shared-model';
import {
  fromFirestoreActivity,
  toFirestoreActivity,
  toFirestoreActivityUpdate,
  toFirestoreActivityDelete,
} from '../utils/activityConverter';
import { toFirestoreStandardDelete } from '../utils/standardConverter';
import debounce from 'lodash.debounce';

export interface UseActivitiesResult {
  activities: Activity[]; // Filtered and sorted activities based on search query
  allActivities: Activity[]; // All activities (unfiltered) for checking total count
  recentActivities: Activity[]; // Five most recent activities by updatedAtMs
  loading: boolean;
  error: Error | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  createActivity: (activity: Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'>) => Promise<Activity>;
  updateActivity: (activityId: string, updates: Partial<Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'>>) => Promise<void>;
  deleteActivity: (activityId: string) => Promise<void>;
  restoreActivity: (activity: Activity) => Promise<void>;
}

/**
 * Filters activities by search query using case-insensitive substring matching.
 */
function filterActivitiesBySearch(activities: Activity[], searchQuery: string): Activity[] {
  if (!searchQuery.trim()) {
    return activities;
  }
  
  const query = searchQuery.toLowerCase();
  return activities.filter((activity) =>
    activity.name.toLowerCase().includes(query)
  );
}

/**
 * Sorts activities alphabetically by name.
 */
function sortActivitiesByName(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Deduplicates activities by ID, keeping the last occurrence.
 */
function deduplicateActivitiesById(activities: Activity[]): Activity[] {
  const seen = new Map<string, Activity>();
  // Iterate in reverse to keep the last occurrence of each ID
  for (let i = activities.length - 1; i >= 0; i--) {
    const activity = activities[i];
    if (!seen.has(activity.id)) {
      seen.set(activity.id, activity);
    }
  }
  return Array.from(seen.values());
}

/**
 * Hook to manage Activities collection with search, CRUD operations, and optimistic updates.
 * 
 * Features:
 * - Real-time subscription to user's activities collection
 * - Client-side substring search with debounced input
 * - Filters out soft-deleted activities
 * - Optimistic updates for create/update/delete operations
 * - Offline persistence support via Firestore
 */
export function useActivities(): UseActivitiesResult {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQueryInput, setSearchQueryInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const pendingActivityUpdatesRef = useRef<
    Map<
      string,
      {
        updates: Partial<
          Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'>
        >;
        updatedAtMs: number;
      }
    >
  >(new Map());
  const lastCategoryUpdateRef = useRef<{
    activityId: string;
    optimisticUpdatedAtMs: number;
  } | null>(null);

  const userId = firebaseAuth.currentUser?.uid;

  // Debounced search query for filtering
  useEffect(() => {
    const debounced = debounce((query: string) => {
      setSearchQuery(query);
    }, 300);

    debounced(searchQueryInput);

    return () => {
      debounced.cancel();
    };
  }, [searchQueryInput]);

  // Subscribe to activities collection
  useEffect(() => {
    if (!userId) {
      console.warn('[useActivities] No user ID available - cannot subscribe to activities collection');
      setLoading(false);
      setError(new Error('User not authenticated'));
      return;
    }

    console.log('[useActivities] Subscribing to activities collection for user:', userId);
    setLoading(true);
    setError(null);

    const activitiesQuery = query(
      collection(doc(firebaseFirestore, 'users', userId), 'activities'),
      where('deletedAt', '==', null) // Filter out soft-deleted
    );

    const unsubscribe = activitiesQuery.onSnapshot(
      (snapshot) => {
        try {
          const activitiesList: Activity[] = [];
          
          snapshot.forEach((doc) => {
            try {
              const data = doc.data() as any;
              if (lastCategoryUpdateRef.current?.activityId === doc.id) {
                console.debug('[useActivities] Raw snapshot category field', {
                  activityId: doc.id,
                  categoryId: data?.categoryId ?? null,
                  updatedAt: data?.updatedAt ?? null,
                });
              }
              const activity = fromFirestoreActivity(doc.id, data);
              activitiesList.push(activity);
            } catch (err) {
              console.error('[useActivities] Error parsing activity', {
                activityId: doc.id,
                error: err instanceof Error ? err.message : err,
              });
            }
          });

          const pendingUpdates = pendingActivityUpdatesRef.current;
          const mergedWithPending = activitiesList.map((activity) => {
            const pending = pendingUpdates.get(activity.id);
            if (!pending) {
              return activity;
            }

            if (activity.updatedAtMs >= pending.updatedAtMs) {
              pendingUpdates.delete(activity.id);
              return activity;
            }

            return {
              ...activity,
              ...pending.updates,
              updatedAtMs: pending.updatedAtMs,
            };
          });

          // Deduplicate and sort to prevent duplicates from race conditions
          const deduplicated = deduplicateActivitiesById(mergedWithPending);
          if (lastCategoryUpdateRef.current) {
            const { activityId, optimisticUpdatedAtMs } = lastCategoryUpdateRef.current;
            const updatedActivity = deduplicated.find((activity) => activity.id === activityId);
            console.debug('[useActivities] Snapshot category check', {
              activityId,
              optimisticUpdatedAtMs,
              found: Boolean(updatedActivity),
              categoryId: updatedActivity?.categoryId ?? null,
              updatedAtMs: updatedActivity?.updatedAtMs ?? null,
              pendingUpdate: pendingUpdates.has(activityId),
            });
          }
          console.debug('[useActivities] Snapshot received', {
            count: deduplicated.length,
            pendingUpdates: pendingUpdates.size,
            fromCache: snapshot.metadata.fromCache,
            hasPendingWrites: snapshot.metadata.hasPendingWrites,
          });
          setActivities(deduplicated);
          setLoading(false);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setLoading(false);
        }
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Optimistic create activity
  const createActivity = useCallback(
    async (
      activityData: Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'>
    ): Promise<Activity> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const activitiesCollection = collection(
        doc(firebaseFirestore, 'users', userId),
        'activities'
      );

      // Create temporary ID for optimistic update
      const tempId = `temp_${Date.now()}`;
      const tempActivity: Activity = {
        ...activityData,
        id: tempId,
        createdAtMs: Date.now(),
        updatedAtMs: Date.now(),
        deletedAtMs: null,
      };

      // Optimistic update
      setActivities((prev) => {
        const updated = [...prev, tempActivity];
        const deduplicated = deduplicateActivitiesById(updated);
        return sortActivitiesByName(deduplicated);
      });

      try {
        // Create document in Firestore
        const docRef = doc(activitiesCollection);
        
        // Convert to Firestore format (unit will be normalized by schema)
        const firestoreData = toFirestoreActivity(activityData);
        
        await docRef.set(firestoreData);

        // Fetch the created doc to return it
        const createdDoc = await docRef.get();
        const createdActivity = fromFirestoreActivity(
          createdDoc.id,
          createdDoc.data() as any
        );

        // Remove temp activity - the snapshot listener will add the real one
        // Deduplication in the snapshot handler will prevent duplicates
        setActivities((prev) => {
          const filtered = prev.filter((a) => a.id !== tempId);
          const deduplicated = deduplicateActivitiesById(filtered);
          return sortActivitiesByName(deduplicated);
        });

        return createdActivity;
      } catch (err) {
        // Rollback optimistic update
        setActivities((prev) => prev.filter((a) => a.id !== tempId));
        throw err;
      }
    },
    [userId]
  );

  // Optimistic update activity
  const updateActivity = useCallback(
    async (
      activityId: string,
      updates: Partial<Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'>>
    ): Promise<void> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

        const docRef = doc(
          collection(doc(firebaseFirestore, 'users', userId), 'activities'),
          activityId
        );

      const normalizedUpdates: Partial<
        Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'>
      > = {};
      if (updates.name !== undefined) {
        normalizedUpdates.name = updates.name;
      }
      if (updates.unit !== undefined) {
        normalizedUpdates.unit = updates.unit;
      }
      if (updates.notes !== undefined) {
        normalizedUpdates.notes = updates.notes;
      }
      if (updates.categoryId !== undefined) {
        normalizedUpdates.categoryId = updates.categoryId ?? null;
      }

      const optimisticUpdatedAtMs = Date.now();
      console.debug('[useActivities] Optimistic update start', {
        activityId,
        updates: normalizedUpdates,
        optimisticUpdatedAtMs,
      });
      if (normalizedUpdates.categoryId !== undefined) {
        lastCategoryUpdateRef.current = { activityId, optimisticUpdatedAtMs };
      }

      // Optimistic update
      setActivities((prev) => {
        const activity = prev.find((a) => a.id === activityId);
        if (!activity) {
          pendingActivityUpdatesRef.current.delete(activityId);
          console.warn('[useActivities] Activity not found for update', {
            activityId,
            updates: normalizedUpdates,
          });
          return prev;
        }

        pendingActivityUpdatesRef.current.set(activityId, {
          updates: normalizedUpdates,
          updatedAtMs: optimisticUpdatedAtMs,
        });
        console.debug('[useActivities] Optimistic update applied', {
          activityId,
          categoryId: normalizedUpdates.categoryId ?? activity.categoryId ?? null,
          optimisticUpdatedAtMs,
          pendingUpdates: pendingActivityUpdatesRef.current.size,
        });

        const updated = {
          ...activity,
          ...normalizedUpdates,
          updatedAtMs: optimisticUpdatedAtMs,
        };

        const filtered = prev.filter((a) => a.id !== activityId);
        const updatedList = [...filtered, updated];
        const deduplicated = deduplicateActivitiesById(updatedList);
        return sortActivitiesByName(deduplicated);
      });

      try {
        const firestoreData = toFirestoreActivityUpdate(normalizedUpdates);
        await docRef.update(firestoreData);
        console.debug('[useActivities] Firestore update completed', {
          activityId,
          updates: normalizedUpdates,
        });
      } catch (err) {
        console.error('[updateActivity] Error updating activity:', err);
        pendingActivityUpdatesRef.current.delete(activityId);
        // Rollback: re-fetch or restore from snapshot
        // The snapshot listener will update it correctly
        throw err;
      }
    },
    [userId]
  );

  // Optimistic delete activity (soft delete)
  const deleteActivity = useCallback(
    async (activityId: string): Promise<void> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

        const docRef = doc(
          collection(doc(firebaseFirestore, 'users', userId), 'activities'),
          activityId
        );

      // Optimistic update: remove from list
      const activityToDelete = activities.find((a) => a.id === activityId);
      setActivities((prev) => prev.filter((a) => a.id !== activityId));

      try {
        // Soft delete activity + any Standards that reference it so the Standards Library stays consistent.
        // Use a batch so we don't end up with a deleted activity but orphaned standards.
        const standardsQuery = query(
          collection(doc(firebaseFirestore, 'users', userId), 'standards'),
          where('activityId', '==', activityId)
        );
        const standardsSnapshot = await standardsQuery.get();

        const batch = firebaseFirestore.batch();
        batch.update(docRef, toFirestoreActivityDelete());

        standardsSnapshot.forEach((standardDoc: any) => {
          const data = standardDoc.data?.() as any;
          // Skip already-deleted standards (idempotent).
          if (data?.deletedAt != null) {
            return;
          }
          batch.update(standardDoc.ref, toFirestoreStandardDelete());
        });

        await batch.commit();
      } catch (err) {
        // Rollback: restore activity
        if (activityToDelete) {
          setActivities((prev) => {
            const updated = [...prev, activityToDelete];
            const deduplicated = deduplicateActivitiesById(updated);
            return sortActivitiesByName(deduplicated);
          });
        }
        throw err;
      }
    },
    [userId, activities]
  );

  const restoreActivity = useCallback(
    async (activity: Activity): Promise<void> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

        const docRef = firebaseFirestore
        .collection('users')
        .doc(userId)
        .collection('activities')
        .doc(activity.id);

      setActivities((prev) => {
        const filtered = prev.filter((a) => a.id !== activity.id);
        const restored = [
          ...filtered,
          { ...activity, deletedAtMs: null, updatedAtMs: Date.now() }
        ];
        const deduplicated = deduplicateActivitiesById(restored);
        return sortActivitiesByName(deduplicated);
      });

      try {
        await docRef.update({
          deletedAt: null,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        setActivities((prev) => prev.filter((a) => a.id !== activity.id));
        throw err;
      }
    },
    [userId]
  );

  // Filter and sort activities based on search query
  const filteredAndSortedActivities = useMemo(() => {
    const filtered = filterActivitiesBySearch(activities, searchQuery);
    return sortActivitiesByName(filtered);
  }, [activities, searchQuery]);

  // Get five most recent activities ordered by updatedAtMs descending
  const recentActivities = useMemo(() => {
    return [...activities]
      .sort((a, b) => b.updatedAtMs - a.updatedAtMs)
      .slice(0, 5);
  }, [activities]);

  return {
    activities: filteredAndSortedActivities,
    allActivities: activities, // Return unfiltered list for checking total count
    recentActivities,
    loading,
    error,
    searchQuery: searchQueryInput, // Return the input value for UI display
    setSearchQuery: setSearchQueryInput,
    createActivity,
    updateActivity,
    deleteActivity,
    restoreActivity
  };
}
