import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  query,
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
import debounce from 'lodash.debounce';

export interface UseActivitiesResult {
  activities: Activity[];
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
              const activity = fromFirestoreActivity(doc.id, data);
              activitiesList.push(activity);
            } catch (err) {
              console.error(`Error parsing activity ${doc.id}:`, err);
            }
          });

          setActivities(activitiesList);
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
        return sortActivitiesByName(updated);
      });

      try {
        // Create document in Firestore
        const docRef = doc(activitiesCollection);
        
        // Convert to Firestore format (unit will be normalized by schema)
        const firestoreData = toFirestoreActivity(activityData);
        
        await docRef.set(firestoreData);

        // Wait for snapshot to update, or fetch the created doc
        const createdDoc = await docRef.get();
        const createdActivity = fromFirestoreActivity(
          createdDoc.id,
          createdDoc.data() as any
        );

        // Remove temp and add real activity
        setActivities((prev) => {
          const filtered = prev.filter((a) => a.id !== tempId);
          const updated = [...filtered, createdActivity];
          return sortActivitiesByName(updated);
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

      // Optimistic update
      setActivities((prev) => {
        const activity = prev.find((a) => a.id === activityId);
        if (!activity) {
          return prev;
        }

        const updated = {
          ...activity,
          ...updates,
          updatedAtMs: Date.now(),
        };

        const filtered = prev.filter((a) => a.id !== activityId);
        const updatedList = [...filtered, updated];
        return sortActivitiesByName(updatedList);
      });

      try {
        const activity = activities.find((a) => a.id === activityId);
        if (!activity) {
          throw new Error('Activity not found');
        }

        const firestoreData = toFirestoreActivityUpdate(updates);
        await docRef.update(firestoreData);
      } catch (err) {
        // Rollback: re-fetch or restore from snapshot
        // The snapshot listener will update it correctly
        throw err;
      }
    },
    [userId, activities]
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
        // Soft delete by setting deletedAt
        const firestoreData = toFirestoreActivityDelete();
        await docRef.update(firestoreData);
      } catch (err) {
        // Rollback: restore activity
        if (activityToDelete) {
          setActivities((prev) => {
            const updated = [...prev, activityToDelete];
            return sortActivitiesByName(updated);
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
        return sortActivitiesByName(restored);
      });

      try {
        await docRef.update({
          deletedAt: null,
          updatedAt: firebaseFirestore.FieldValue.serverTimestamp()
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
