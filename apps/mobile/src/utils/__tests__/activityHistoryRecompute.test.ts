import { recomputeActivityHistoryPeriod } from '../activityHistoryRecompute';
import { writeActivityHistoryPeriod } from '../activityHistoryFirestore';

const mockGetDocs = jest.fn();
const mockWriteActivityHistoryPeriod = jest.fn();

jest.mock('@react-native-firebase/firestore', () => ({
  collection: jest.fn(() => 'collection-ref'),
  doc: jest.fn(() => 'doc-ref'),
  getDocs: mockGetDocs,
  query: jest.fn(() => 'query-ref'),
  where: jest.fn(() => 'where-ref'),
  Timestamp: {
    fromMillis: jest.fn((ms: number) => ({ toMillis: () => ms })),
  },
}));

jest.mock('../../firebase/firebaseApp', () => ({
  firebaseFirestore: 'firestore-instance',
}));

jest.mock('../activityHistoryFirestore', () => ({
  writeActivityHistoryPeriod: mockWriteActivityHistoryPeriod,
}));

describe('recomputeActivityHistoryPeriod', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDocs.mockResolvedValue({
      forEach: (callback: (doc: { data: () => Record<string, unknown> }) => void) => {
        const rows = [
          { value: 30, deletedAt: null },
          { value: 15, deletedAt: null },
          { value: 10, deletedAt: { toMillis: () => Date.now() } },
        ];
        rows.forEach((row) => {
          callback({
            data: () => row,
          });
        });
      },
    });
  });

  it('writes recomputed rollup for the affected period window', async () => {
    const standard = {
      id: 'standard-1',
      activityId: 'activity-1',
      minimum: 60,
      unit: 'calls',
      cadence: { interval: 1, unit: 'week' },
      state: 'active',
      summary: '60 calls / week',
      archivedAtMs: null,
      createdAtMs: 0,
      updatedAtMs: 0,
      deletedAtMs: null,
      sessionConfig: {
        sessionLabel: 'session',
        sessionsPerCadence: 5,
        volumePerSession: 12,
      },
    };

    await recomputeActivityHistoryPeriod({
      userId: 'user-1',
      standard,
      occurredAtMs: Date.UTC(2024, 0, 5),
    });

    expect(mockGetDocs).toHaveBeenCalled();
    expect(writeActivityHistoryPeriod).toBe(mockWriteActivityHistoryPeriod);
    expect(mockWriteActivityHistoryPeriod).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        standardId: 'standard-1',
        activityId: 'activity-1',
        rollup: expect.objectContaining({
          total: 45,
          currentSessions: 2,
          targetSessions: 5,
        }),
        source: 'log-edit',
      })
    );
  });
});
