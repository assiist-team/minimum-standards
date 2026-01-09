import { renderHook, waitFor } from '@testing-library/react-native';
import { useStandards } from '../useStandards';
import { recomputeActivityHistoryPeriod } from '../../utils/activityHistoryRecompute';
import { emitActivityLogMutation } from '../../utils/activityLogEvents';

jest.mock('../../utils/activityHistoryRecompute', () => ({
  recomputeActivityHistoryPeriod: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/activityLogEvents', () => ({
  emitActivityLogMutation: jest.fn(),
  subscribeToActivityLogMutations: jest.fn(),
}));

const mockUnsubscribe = jest.fn();

type Standard = {
  id: string;
  activityId: string;
  minimum: number;
  unit: string;
  cadence: { interval: number; unit: 'day' | 'week' | 'month' };
  state: 'active' | 'archived';
  summary: string;
  archivedAtMs: number | null;
  createdAtMs: number;
  updatedAtMs: number;
  deletedAtMs: number | null;
  sessionConfig?: {
    sessionLabel: string;
    sessionsPerCadence: number;
    volumePerSession: number;
  };
  periodStartPreference?: {
    mode: 'default' | 'weekDay';
    weekStartDay?: number;
  };
};

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
let mockAuth: jest.Mock;
const mockRecomputeActivityHistoryPeriod =
  recomputeActivityHistoryPeriod as jest.MockedFunction<
    typeof recomputeActivityHistoryPeriod
  >;
const mockEmitActivityLogMutation =
  emitActivityLogMutation as jest.MockedFunction<typeof emitActivityLogMutation>;

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

jest.mock('@react-native-firebase/auth', () => {
  mockAuth = jest.fn(() => ({
    currentUser: { uid: 'test-user-id' },
  }));
  return {
    __esModule: true,
    default: mockAuth,
  };
});

describe('useStandards - Log Operations', () => {
  const mockStandard = {
    id: 'standard-1',
    activityId: 'activity-1',
    minimum: 100,
    unit: 'calls',
    cadence: { interval: 1, unit: 'week' },
    state: 'active',
    summary: '100 calls / week',
    archivedAtMs: null,
    createdAtMs: 1000,
    updatedAtMs: 1000,
    deletedAtMs: null,
  };

  const mockArchivedStandard = {
    ...mockStandard,
    id: 'standard-2',
    state: 'archived',
    archivedAtMs: 2000,
  };

  let standardsCollection: { doc: jest.Mock; where: jest.Mock };
  let activityLogsCollection: { doc: jest.Mock };
  let preferencesCollection: { doc: jest.Mock };
  let usersCollection: { doc: jest.Mock };
  const logDocRefsById: Record<string, { update: jest.Mock }> = {};

  const getLogDocRef = (logId: string) => {
    if (!logDocRefsById[logId]) {
      logDocRefsById[logId] = {
        update: jest.fn().mockResolvedValue(undefined),
      };
    }
    return logDocRefsById[logId];
  };

  const createStandardsSnapshot = (standards: Standard[]) => ({
    forEach: (callback: (doc: any) => void) => {
      standards
        .filter((s) => s.deletedAtMs == null)
        .forEach((standard) => {
          callback({
            id: standard.id,
            data: () => ({
              activityId: standard.activityId,
              minimum: standard.minimum,
              unit: standard.unit,
              cadence: standard.cadence,
              state: standard.state,
              summary: standard.summary,
              archivedAt: standard.archivedAtMs
                ? { toMillis: () => standard.archivedAtMs }
                : null,
              createdAt: { toMillis: () => standard.createdAtMs },
              updatedAt: { toMillis: () => standard.updatedAtMs },
              deletedAt: null,
            }),
          });
        });
    },
  });

  const mockStandardsOnSnapshot = jest.fn((onNext: (snapshot: any) => void) => {
    onNext(createStandardsSnapshot([mockStandard]));
    return mockUnsubscribe;
  });

  const mockPinsOnSnapshot = jest.fn((onNext: (snapshot: any) => void) => {
    onNext({
      exists: true,
      data: () => ({
        pinnedStandardIds: [],
        updatedAt: { toMillis: () => Date.now() },
      }),
    });
    return mockUnsubscribe;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRecomputeActivityHistoryPeriod.mockClear();
    mockEmitActivityLogMutation.mockClear();
    mockAuth.mockReturnValue({
      currentUser: { uid: 'test-user-id' },
    });
    logDocRefsById['log-1'] = {
      update: jest.fn().mockResolvedValue(undefined),
    };

    standardsCollection = {
      doc: jest.fn(),
      where: jest.fn(() => ({
        onSnapshot: mockStandardsOnSnapshot,
      })),
    };

    activityLogsCollection = {
      doc: jest.fn((logId: string) => getLogDocRef(logId)),
    };

    preferencesCollection = {
      doc: jest.fn(() => ({
        set: jest.fn().mockResolvedValue(undefined),
        onSnapshot: mockPinsOnSnapshot,
      })),
    };

    usersCollection = {
      doc: jest.fn(() => ({
        collection: jest.fn((collectionName: string) => {
          if (collectionName === 'standards') {
            return standardsCollection;
          }
          if (collectionName === 'activityLogs') {
            return activityLogsCollection;
          }
          if (collectionName === 'preferences') {
            return preferencesCollection;
          }
          throw new Error(`Unexpected collection ${collectionName}`);
        }),
      })),
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

  describe('updateLogEntry', () => {
    it('should update log entry with editedAt timestamp', async () => {
      const { result } = renderHook(() => useStandards());

      await waitFor(() => {
        expect(result.current.standards.length).toBeGreaterThan(0);
      });

      await waitFor(async () => {
        await result.current.updateLogEntry({
          logEntryId: 'log-1',
          standardId: 'standard-1',
          value: 50,
          occurredAtMs: 1000000,
          note: 'Updated note',
        });
      });

      expect(logDocRefsById['log-1'].update).toHaveBeenCalledWith({
        value: 50,
        occurredAt: expect.any(Object),
        note: 'Updated note',
        editedAt: expect.any(Object),
        updatedAt: expect.any(Object),
      });
    });

    it('should emit mutation event and recompute history after update', async () => {
      const { result } = renderHook(() => useStandards());

      await waitFor(() => {
        expect(result.current.standards.length).toBeGreaterThan(0);
      });

      await waitFor(async () => {
        await result.current.updateLogEntry({
          logEntryId: 'log-1',
          standardId: 'standard-1',
          value: 50,
          occurredAtMs: 1000000,
          note: 'Updated note',
        });
      });

      expect(mockEmitActivityLogMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'update',
          standardId: 'standard-1',
          occurredAtMs: 1000000,
          logEntryId: 'log-1',
        })
      );
      expect(mockRecomputeActivityHistoryPeriod).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-id',
          occurredAtMs: 1000000,
          source: 'log-edit',
          standard: expect.objectContaining({ id: 'standard-1' }),
        })
      );
    });

    it('should reject update for archived standard', async () => {
      mockStandardsOnSnapshot.mockImplementationOnce((onNext: (snapshot: any) => void) => {
        onNext(createStandardsSnapshot([mockArchivedStandard]));
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useStandards());

      await waitFor(() => {
        expect(result.current.standards.length).toBeGreaterThan(0);
      });

      await expect(
        result.current.updateLogEntry({
          logEntryId: 'log-1',
          standardId: 'standard-2',
          value: 50,
          occurredAtMs: 1000000,
        })
      ).rejects.toThrow('This Standard is archived. Unarchive it to edit logs.');
    });

    it('should reject update when user not authenticated', async () => {
      mockAuth.mockReturnValue({
        currentUser: null,
      } as any);

      const { result } = renderHook(() => useStandards());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      await expect(
        result.current.updateLogEntry({
          logEntryId: 'log-1',
          standardId: 'standard-1',
          value: 50,
          occurredAtMs: 1000000,
        })
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('deleteLogEntry', () => {
    it('should soft-delete log entry by setting deletedAt timestamp', async () => {
      const { result } = renderHook(() => useStandards());

      await waitFor(() => {
        expect(result.current.standards.length).toBeGreaterThan(0);
      });

      await waitFor(async () => {
        await result.current.deleteLogEntry({
          logEntryId: 'log-1',
          standardId: 'standard-1',
          occurredAtMs: 1000000,
        });
      });

      expect(logDocRefsById['log-1'].update).toHaveBeenCalledWith({
        deletedAt: expect.any(Object),
        updatedAt: expect.any(Object),
      });
    });

    it('should reject delete for archived standard', async () => {
      mockStandardsOnSnapshot.mockImplementationOnce((onNext: (snapshot: any) => void) => {
        onNext(createStandardsSnapshot([mockArchivedStandard]));
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useStandards());

      await waitFor(() => {
        expect(result.current.standards.length).toBeGreaterThan(0);
      });

      await expect(
        result.current.deleteLogEntry({
          logEntryId: 'log-1',
          standardId: 'standard-2',
          occurredAtMs: 1000000,
        })
      ).rejects.toThrow('This Standard is archived. Unarchive it to delete logs.');
    });

    it('should reject delete when user not authenticated', async () => {
      mockAuth.mockReturnValue({
        currentUser: null,
      } as any);

      const { result } = renderHook(() => useStandards());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      await expect(
        result.current.deleteLogEntry({
          logEntryId: 'log-1',
          standardId: 'standard-1',
          occurredAtMs: 1000000,
        })
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('restoreLogEntry', () => {
    it('should restore log entry by clearing deletedAt', async () => {
      const { result } = renderHook(() => useStandards());

      await waitFor(() => {
        expect(result.current.standards.length).toBeGreaterThan(0);
      });

      await waitFor(async () => {
        await result.current.restoreLogEntry({
          logEntryId: 'log-1',
          standardId: 'standard-1',
          occurredAtMs: 1000000,
        });
      });

      expect(logDocRefsById['log-1'].update).toHaveBeenCalledWith({
        deletedAt: null,
        updatedAt: expect.any(Object),
      });
    });

    it('should reject restore for archived standard', async () => {
      mockStandardsOnSnapshot.mockImplementationOnce((onNext: (snapshot: any) => void) => {
        onNext(createStandardsSnapshot([mockArchivedStandard]));
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useStandards());

      await waitFor(() => {
        expect(result.current.standards.length).toBeGreaterThan(0);
      });

      await expect(
        result.current.restoreLogEntry({
          logEntryId: 'log-1',
          standardId: 'standard-2',
          occurredAtMs: 1000000,
        })
      ).rejects.toThrow('This Standard is archived. Unarchive it to restore logs.');
    });

    it('should reject restore when user not authenticated', async () => {
      mockAuth.mockReturnValue({
        currentUser: null,
      } as any);

      const { result } = renderHook(() => useStandards());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      await expect(
        result.current.restoreLogEntry({
          logEntryId: 'log-1',
          standardId: 'standard-1',
          occurredAtMs: 1000000,
        })
      ).rejects.toThrow('User not authenticated');
    });
  });
});
