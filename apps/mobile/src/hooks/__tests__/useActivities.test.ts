import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useActivities } from '../useActivities';
import type { Activity } from '@minimum-standards/shared-model';

type MockActivity = {
  id: string;
  name: string;
  unit: string;
  createdAtMs: number;
  updatedAtMs: number;
  deletedAtMs: number | null;
};

const mockUnsubscribe = jest.fn();

type MockFirestoreModuleInstance = {
  collection: jest.Mock;
  FieldValue: { serverTimestamp: jest.Mock };
  Timestamp: { now: jest.Mock; fromMillis: jest.Mock };
};

type MockFirestoreDefaultExport = jest.Mock & {
  FieldValue: MockFirestoreModuleInstance['FieldValue'];
  Timestamp: MockFirestoreModuleInstance['Timestamp'];
};

let mockFirestoreModuleInstance: MockFirestoreModuleInstance;

jest.mock('@react-native-firebase/firestore', () => {
  mockFirestoreModuleInstance = {
    collection: jest.fn(),
    FieldValue: {
      serverTimestamp: jest.fn(() => ({ _methodName: 'serverTimestamp' })),
    },
    Timestamp: {
      now: jest.fn(() => ({
        toMillis: () => Date.now(),
      })),
      fromMillis: jest.fn((ms: number) => ({
        toMillis: () => ms,
      })),
    },
  };
  const defaultExport = Object.assign(jest.fn(() => mockFirestoreModuleInstance), {
    FieldValue: mockFirestoreModuleInstance.FieldValue,
    Timestamp: mockFirestoreModuleInstance.Timestamp,
  }) as MockFirestoreDefaultExport;
  return {
    __esModule: true,
    default: defaultExport,
  };
});

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    currentUser: { uid: 'test-user-id' },
  })),
}));

describe('useActivities', () => {
  jest.useFakeTimers();

  let mockActivities: MockActivity[];
  let activitiesCollection: {
    doc: jest.Mock;
    where: jest.Mock;
  };
  let usersCollection: { doc: jest.Mock };
  let nextCreateDocRef: {
    id: string;
    set: jest.Mock;
    get: jest.Mock;
  };
  const docRefsById: Record<
    string,
    {
      update: jest.Mock;
    }
  > = {};

  const createSnapshot = () => ({
    forEach: (callback: (doc: any) => void) => {
      mockActivities
        .filter((activity) => activity.deletedAtMs == null)
        .forEach((activity) => {
        callback({
          id: activity.id,
          data: () => ({
            name: activity.name,
            unit: activity.unit,
            createdAt: { toMillis: () => activity.createdAtMs },
            updatedAt: { toMillis: () => activity.updatedAtMs },
            deletedAt: activity.deletedAtMs
              ? { toMillis: () => activity.deletedAtMs }
              : null,
          }),
        });
        });
    },
  });

  const mockOnSnapshot = jest.fn((onNext: (snapshot: any) => void) => {
    onNext(createSnapshot());
    return mockUnsubscribe;
  });

  const resetCreateDocRef = () => {
    let lastSavedPayload: any = null;
    nextCreateDocRef = {
      id: 'generated-id',
      set: jest.fn(async (payload) => {
        lastSavedPayload = payload;
      }),
      get: jest.fn(async () => ({
        id: 'generated-id',
        data: () => ({
          name: lastSavedPayload?.name ?? 'Workouts',
          unit: lastSavedPayload?.unit ?? 'workouts',
          createdAt: { toMillis: () => 1111 },
          updatedAt: { toMillis: () => 1111 },
          deletedAt: null,
        }),
      })),
    };
  };

  const getDocRef = (id: string) => {
    if (!docRefsById[id]) {
      docRefsById[id] = {
        update: jest.fn(async () => undefined),
      };
    }
    return docRefsById[id];
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockActivities = [
      {
        id: 'a1',
        name: 'Sales Calls',
        unit: 'calls',
        createdAtMs: 1_000,
        updatedAtMs: 2_000,
        deletedAtMs: null,
      },
      {
        id: 'a2',
        name: 'Workouts',
        unit: 'workouts',
        createdAtMs: 1_000,
        updatedAtMs: 2_000,
        deletedAtMs: null,
      },
      {
        id: 'a3',
        name: 'Archived',
        unit: 'hours',
        createdAtMs: 1_000,
        updatedAtMs: 2_000,
        deletedAtMs: 3_000,
      },
    ];
    resetCreateDocRef();

    activitiesCollection = {
      doc: jest.fn((docId?: string) => {
        if (docId) {
          return getDocRef(docId);
        }
        return nextCreateDocRef;
      }),
      where: jest.fn(() => ({
        onSnapshot: mockOnSnapshot,
      })),
    };

    usersCollection = {
      doc: jest
        .fn()
        .mockReturnValue({ collection: jest.fn(() => activitiesCollection) }),
    };

    mockFirestoreModuleInstance.collection.mockImplementation(
      (collectionName: string) => {
        if (collectionName === 'users') {
          return usersCollection;
        }
        throw new Error(`Unexpected collection ${collectionName}`);
      }
    );
  });

  test('initial load fetches activities and filters out soft-deleted', async () => {
    const { result } = renderHook(() => useActivities());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activities).toHaveLength(2);
    expect(result.current.activities.find((a) => a.id === 'a3')).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  test('substring search filters activities by name', async () => {
    const { result } = renderHook(() => useActivities());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.setSearchQuery('work');
      jest.advanceTimersByTime(350);
    });

    await waitFor(() => expect(result.current.activities).toHaveLength(1));
    expect(result.current.activities[0].name).toBe('Workouts');
  });

  test('createActivity rolls back optimistic entry on failure', async () => {
    const { result } = renderHook(() => useActivities());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const initialLength = result.current.activities.length;

    nextCreateDocRef.set.mockRejectedValueOnce(new Error('Network failure'));

    await act(async () => {
      await expect(
        result.current.createActivity({
          name: 'Daily Journals',
          unit: 'journal',
        })
      ).rejects.toThrow('Network failure');
    });

    expect(result.current.activities).toHaveLength(initialLength);
    expect(
      result.current.activities.find((activity) => activity.name === 'Daily Journals')
    ).toBeUndefined();
  });

  test('updateActivity performs optimistic update', async () => {
    const { result } = renderHook(() => useActivities());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateActivity('a1', { name: 'Updated Calls' });
    });

    expect(result.current.activities.find((a) => a.id === 'a1')?.name).toBe(
      'Updated Calls'
    );
    expect(getDocRef('a1').update).toHaveBeenCalled();
  });

  test('deleteActivity removes activity and restoreActivity re-adds it', async () => {
    const { result } = renderHook(() => useActivities());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const activity: Activity = result.current.activities[0];

    await act(async () => {
      await result.current.deleteActivity(activity.id);
    });

    expect(result.current.activities.find((a) => a.id === activity.id)).toBeUndefined();

    await act(async () => {
      await result.current.restoreActivity(activity);
    });

    expect(result.current.activities.find((a) => a.id === activity.id)).toBeDefined();
    expect(getDocRef(activity.id).update).toHaveBeenCalled();
  });
});
