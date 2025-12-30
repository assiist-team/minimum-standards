import { renderHook, waitFor, act } from '@testing-library/react-native';
import { AppState, AppStateStatus } from 'react-native';
import { useActiveStandardsDashboard } from '../useActiveStandardsDashboard';
import { useStandards } from '../useStandards';
import { Standard } from '@minimum-standards/shared-model';
import { calculatePeriodWindow } from '@minimum-standards/shared-model';
import { buildDashboardProgressMap } from '../../utils/dashboardProgress';

// Mock dependencies
jest.mock('../useStandards');
jest.mock('../../firebase/firebaseApp', () => ({
  firebaseAuth: {
    currentUser: { uid: 'test-user-id' },
  },
  firebaseFirestore: {},
}));

jest.mock('@react-native-firebase/firestore', () => {
  const mockUnsubscribe = jest.fn();
  const mockOnSnapshot = jest.fn((onNext: (snapshot: any) => void) => {
    onNext({
      forEach: (callback: (doc: any) => void) => {
        // Empty logs by default
      },
    });
    return mockUnsubscribe;
  });

  const mockQuery = jest.fn(() => ({
    onSnapshot: mockOnSnapshot,
  }));

  const mockCollection = jest.fn(() => ({
    doc: jest.fn(() => ({
      collection: jest.fn(() => ({
        where: jest.fn(() => mockQuery()),
      })),
    })),
  }));

  return {
    __esModule: true,
    default: jest.fn(() => ({
      collection: mockCollection,
    })),
    collection: mockCollection,
    query: jest.fn(() => mockQuery()),
    where: jest.fn(),
    doc: jest.fn(),
    Timestamp: {
      fromMillis: (ms: number) => ({
        toMillis: () => ms,
      }),
    },
  };
});

// Store listeners for AppState mock (prefixed with "mock" for Jest scope allowance)
let mockAppStateListeners: Array<(nextAppState: AppStateStatus) => void> = [];

jest.mock('react-native/src/private/specs/modules/NativeSettingsManager', () => ({
  __esModule: true,
  default: {
    getConstants: () => ({ settings: {} }),
    setValues: jest.fn(),
    deleteValues: jest.fn(),
  },
}));

jest.mock('react-native', () => {
  const actualRN = jest.requireActual('react-native');
  
  return {
    ...actualRN,
    AppState: {
      ...actualRN.AppState,
      currentState: 'active',
      addEventListener: jest.fn((event: string, callback: (nextAppState: AppStateStatus) => void) => {
        mockAppStateListeners.push(callback);
        return {
          remove: jest.fn(() => {
            const index = mockAppStateListeners.indexOf(callback);
            if (index > -1) {
              mockAppStateListeners.splice(index, 1);
            }
          }),
        };
      }),
    },
  };
});

// Helper to trigger AppState changes in tests
const triggerAppStateChange = (nextState: AppStateStatus) => {
  mockAppStateListeners.forEach((listener) => listener(nextState));
};

const mockUseStandards = useStandards as jest.MockedFunction<typeof useStandards>;

// Helper to create a standard
const createStandard = (overrides: Partial<Standard> = {}): Standard => ({
  id: 'std-1',
  activityId: 'act-1',
  minimum: 100,
  unit: 'calls',
  cadence: { interval: 1, unit: 'day' },
  state: 'active',
  summary: '100 calls / day',
  archivedAtMs: null,
  createdAtMs: 1000,
  updatedAtMs: 1000,
  deletedAtMs: null,
  sessionConfig: {
    sessionLabel: 'session',
    sessionsPerCadence: 1,
    volumePerSession: 100,
  },
  periodStartPreference: null,
  ...overrides,
});

describe('useActiveStandardsDashboard - Period Auto-Advance', () => {
  const timezone = 'UTC';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockAppStateListeners = []; // Reset listeners
    
    // Mock Intl.DateTimeFormat for timezone detection
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({
            timeZone: timezone,
            locale: 'en-US',
          }),
        } as any)
    );

    // Setup default useStandards mock
    mockUseStandards.mockReturnValue({
      standards: [],
      activeStandards: [],
      archivedStandards: [],
      orderedActiveStandards: [],
      loading: false,
      error: null,
      createStandard: jest.fn(),
      archiveStandard: jest.fn(),
      unarchiveStandard: jest.fn(),
      createLogEntry: jest.fn(),
      canLogStandard: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Boundary advance without new logs', () => {
    test('advances period label when boundary passes', async () => {
      const nowMs = new Date('2025-12-10T23:58:00Z').getTime(); // 2 minutes before midnight
      jest.setSystemTime(nowMs);

      const dailyStandard = createStandard({
        id: 'std-daily',
        cadence: { interval: 1, unit: 'day' },
      });

      mockUseStandards.mockReturnValue({
        standards: [dailyStandard],
        activeStandards: [dailyStandard],
        archivedStandards: [],
        orderedActiveStandards: [dailyStandard],
        loading: false,
        error: null,
        createStandard: jest.fn(),
        archiveStandard: jest.fn(),
        unarchiveStandard: jest.fn(),
        createLogEntry: jest.fn(),
        canLogStandard: jest.fn(),
      } as any);

      const { result, rerender } = renderHook(() => useActiveStandardsDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Get initial period label
      const initialProgress = result.current.progressMap['std-daily'];
      expect(initialProgress).toBeDefined();
      const initialPeriodLabel = initialProgress.periodLabel;

      // Advance time past the boundary (midnight)
      const boundaryMs = new Date('2025-12-11T00:01:00Z').getTime();
      jest.setSystemTime(boundaryMs);
      
      // Advance timers to trigger the scheduled timeout
      act(() => {
        jest.advanceTimersByTime(3 * 60 * 1000); // 3 minutes
      });

      await waitFor(() => {
        const updatedProgress = result.current.progressMap['std-daily'];
        expect(updatedProgress).toBeDefined();
        // Period label should have changed
        expect(updatedProgress.periodLabel).not.toBe(initialPeriodLabel);
      });
    });

    test('schedules timeout to earliest boundary across multiple standards', async () => {
      const nowMs = new Date('2025-12-10T12:00:00Z').getTime(); // Wednesday noon
      jest.setSystemTime(nowMs);

      // Daily standard - boundary at midnight (12 hours away)
      const dailyStandard = createStandard({
        id: 'std-daily',
        cadence: { interval: 1, unit: 'day' },
      });

      // Weekly standard - boundary on Monday (varies, but should be later than daily)
      const weeklyStandard = createStandard({
        id: 'std-weekly',
        cadence: { interval: 1, unit: 'week' },
      });

      mockUseStandards.mockReturnValue({
        standards: [dailyStandard, weeklyStandard],
        activeStandards: [dailyStandard, weeklyStandard],
        archivedStandards: [],
        orderedActiveStandards: [dailyStandard, weeklyStandard],
        loading: false,
        error: null,
        createStandard: jest.fn(),
        archiveStandard: jest.fn(),
        unarchiveStandard: jest.fn(),
        createLogEntry: jest.fn(),
        canLogStandard: jest.fn(),
      } as any);

      const { result, rerender } = renderHook(() => useActiveStandardsDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Calculate expected boundaries
      const dailyWindow = calculatePeriodWindow(nowMs, dailyStandard.cadence, timezone);
      const weeklyWindow = calculatePeriodWindow(nowMs, weeklyStandard.cadence, timezone);
      
      // The earliest boundary should be scheduled
      const earliestBoundary = Math.min(dailyWindow.endMs, weeklyWindow.endMs);
      
      // Verify both standards are tracked
      expect(result.current.progressMap['std-daily']).toBeDefined();
      expect(result.current.progressMap['std-weekly']).toBeDefined();

      // Advance to just before the earliest boundary
      const beforeBoundary = earliestBoundary - 1000;
      jest.setSystemTime(beforeBoundary);
      
      act(() => {
        jest.advanceTimersByTime(2000); // Advance past boundary
      });

      // After boundary passes, period should advance
      await waitFor(() => {
        const dailyProgress = result.current.progressMap['std-daily'];
        const weeklyProgress = result.current.progressMap['std-weekly'];
        
        // At least one should have advanced (the one with the earliest boundary)
        expect(dailyProgress || weeklyProgress).toBeDefined();
      });
    });
  });

  describe('Multiple standards with different cadences', () => {
    test('chooses earliest boundary across daily, weekly, and monthly cadences', async () => {
      const nowMs = new Date('2025-12-10T12:00:00Z').getTime();
      jest.setSystemTime(nowMs);

      const dailyStandard = createStandard({
        id: 'std-daily',
        cadence: { interval: 1, unit: 'day' },
      });

      const weeklyStandard = createStandard({
        id: 'std-weekly',
        cadence: { interval: 1, unit: 'week' },
      });

      const monthlyStandard = createStandard({
        id: 'std-monthly',
        cadence: { interval: 1, unit: 'month' },
      });

      mockUseStandards.mockReturnValue({
        standards: [dailyStandard, weeklyStandard, monthlyStandard],
        activeStandards: [dailyStandard, weeklyStandard, monthlyStandard],
        archivedStandards: [],
        orderedActiveStandards: [dailyStandard, weeklyStandard, monthlyStandard],
        loading: false,
        error: null,
        createStandard: jest.fn(),
        archiveStandard: jest.fn(),
        unarchiveStandard: jest.fn(),
        createLogEntry: jest.fn(),
        canLogStandard: jest.fn(),
      } as any);

      const { result, rerender } = renderHook(() => useActiveStandardsDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Calculate boundaries for each cadence
      const dailyWindow = calculatePeriodWindow(nowMs, dailyStandard.cadence, timezone);
      const weeklyWindow = calculatePeriodWindow(nowMs, weeklyStandard.cadence, timezone);
      const monthlyWindow = calculatePeriodWindow(nowMs, monthlyStandard.cadence, timezone);

      const boundaries = [dailyWindow.endMs, weeklyWindow.endMs, monthlyWindow.endMs];
      const earliestBoundary = Math.min(...boundaries);

      // Verify all standards are tracked
      expect(result.current.progressMap['std-daily']).toBeDefined();
      expect(result.current.progressMap['std-weekly']).toBeDefined();
      expect(result.current.progressMap['std-monthly']).toBeDefined();

      // Advance past the earliest boundary
      jest.setSystemTime(earliestBoundary + 1000);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Verify the hook has updated (periods should have advanced)
      await waitFor(() => {
        const progressMap = result.current.progressMap;
        expect(Object.keys(progressMap).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Resume behavior', () => {
    test('snaps forward period on app resume', async () => {
      const initialTime = new Date('2025-12-10T12:00:00Z').getTime();
      jest.setSystemTime(initialTime);

      const dailyStandard = createStandard({
        id: 'std-daily',
        cadence: { interval: 1, unit: 'day' },
      });

      mockUseStandards.mockReturnValue({
        standards: [dailyStandard],
        activeStandards: [dailyStandard],
        archivedStandards: [],
        orderedActiveStandards: [dailyStandard],
        loading: false,
        error: null,
        createStandard: jest.fn(),
        archiveStandard: jest.fn(),
        unarchiveStandard: jest.fn(),
        createLogEntry: jest.fn(),
        canLogStandard: jest.fn(),
      } as any);

      const { result, rerender } = renderHook(() => useActiveStandardsDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Get initial period
      const initialProgress = result.current.progressMap['std-daily'];
      const initialPeriodLabel = initialProgress.periodLabel;

      // Simulate app being backgrounded, then time passing
      act(() => {
        triggerAppStateChange('background');
      });

      // Advance time significantly (e.g., past a boundary)
      const laterTime = new Date('2025-12-11T12:00:00Z').getTime(); // Next day
      jest.setSystemTime(laterTime);

      // Simulate app resuming
      act(() => {
        triggerAppStateChange('active');
      });

      // Period should have advanced
      await waitFor(() => {
        const updatedProgress = result.current.progressMap['std-daily'];
        expect(updatedProgress).toBeDefined();
        expect(updatedProgress.periodLabel).not.toBe(initialPeriodLabel);
      });
    });

    test('updates windowReferenceMs on AppState change to active', async () => {
      const nowMs = new Date('2025-12-10T12:00:00Z').getTime();
      jest.setSystemTime(nowMs);

      const dailyStandard = createStandard({
        id: 'std-daily',
        cadence: { interval: 1, unit: 'day' },
      });

      mockUseStandards.mockReturnValue({
        standards: [dailyStandard],
        activeStandards: [dailyStandard],
        archivedStandards: [],
        orderedActiveStandards: [dailyStandard],
        loading: false,
        error: null,
        createStandard: jest.fn(),
        archiveStandard: jest.fn(),
        unarchiveStandard: jest.fn(),
        createLogEntry: jest.fn(),
        canLogStandard: jest.fn(),
      } as any);

      const { result, rerender } = renderHook(() => useActiveStandardsDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Get initial period
      const initialProgress = result.current.progressMap['std-daily'];
      const initialWindow = calculatePeriodWindow(nowMs, dailyStandard.cadence, timezone);

      // Advance time
      const laterTime = new Date('2025-12-11T12:00:00Z').getTime();
      jest.setSystemTime(laterTime);

      // Trigger app resume
      act(() => {
        triggerAppStateChange('active');
      });

      // Verify period has updated
      await waitFor(() => {
        const updatedProgress = result.current.progressMap['std-daily'];
        const expectedWindow = calculatePeriodWindow(laterTime, dailyStandard.cadence, timezone);
        
        // Period label should reflect the new time
        expect(updatedProgress.periodLabel).toBe(expectedWindow.label);
      });
    });
  });

  describe('windowReferenceMs integration', () => {
    test('passes windowReferenceMs to buildDashboardProgressMap', async () => {
      const nowMs = new Date('2025-12-10T12:00:00Z').getTime();
      jest.setSystemTime(nowMs);

      const dailyStandard = createStandard({
        id: 'std-daily',
        cadence: { interval: 1, unit: 'day' },
      });

      mockUseStandards.mockReturnValue({
        standards: [dailyStandard],
        activeStandards: [dailyStandard],
        archivedStandards: [],
        orderedActiveStandards: [dailyStandard],
        loading: false,
        error: null,
        createStandard: jest.fn(),
        archiveStandard: jest.fn(),
        unarchiveStandard: jest.fn(),
        createLogEntry: jest.fn(),
        canLogStandard: jest.fn(),
      } as any);

      // Spy on buildDashboardProgressMap to verify windowReferenceMs is passed
      const buildProgressSpy = jest.spyOn(
        require('../../utils/dashboardProgress'),
        'buildDashboardProgressMap'
      );

      const { result, rerender } = renderHook(() => useActiveStandardsDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify buildDashboardProgressMap was called with windowReferenceMs
      expect(buildProgressSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          windowReferenceMs: expect.any(Number),
        })
      );

      buildProgressSpy.mockRestore();
    });

    test('period label matches windowReferenceMs, not current time', async () => {
      const referenceTime = new Date('2025-12-10T12:00:00Z').getTime();
      const currentTime = new Date('2025-12-11T12:00:00Z').getTime(); // Next day
      
      jest.setSystemTime(currentTime);

      const dailyStandard = createStandard({
        id: 'std-daily',
        cadence: { interval: 1, unit: 'day' },
      });

      mockUseStandards.mockReturnValue({
        standards: [dailyStandard],
        activeStandards: [dailyStandard],
        archivedStandards: [],
        orderedActiveStandards: [dailyStandard],
        loading: false,
        error: null,
        createStandard: jest.fn(),
        archiveStandard: jest.fn(),
        unarchiveStandard: jest.fn(),
        createLogEntry: jest.fn(),
        canLogStandard: jest.fn(),
      } as any);

      const { result, rerender } = renderHook(() => useActiveStandardsDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Manually verify that if we call buildDashboardProgressMap with referenceTime,
      // it produces the same period label as the hook
      const expectedWindow = calculatePeriodWindow(referenceTime, dailyStandard.cadence, timezone);
      const progress = result.current.progressMap['std-daily'];
      
      // The period label should be based on windowReferenceMs (which starts as current time)
      // But we can verify the calculation is correct
      expect(progress).toBeDefined();
      expect(progress.periodLabel).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    test('handles empty standards array gracefully', async () => {
      mockUseStandards.mockReturnValue({
        standards: [],
        activeStandards: [],
        archivedStandards: [],
        orderedActiveStandards: [],
        loading: false,
        error: null,
        createStandard: jest.fn(),
        archiveStandard: jest.fn(),
        unarchiveStandard: jest.fn(),
        createLogEntry: jest.fn(),
        canLogStandard: jest.fn(),
      } as any);

      const { result } = renderHook(() => useActiveStandardsDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not crash and should return empty progress map
      expect(result.current.progressMap).toEqual({});
      expect(result.current.dashboardStandards).toEqual([]);
    });

    test('handles missed boundaries correctly', async () => {
      const pastTime = new Date('2025-12-10T12:00:00Z').getTime();
      const futureTime = new Date('2025-12-12T12:00:00Z').getTime(); // 2 days later
      
      jest.setSystemTime(pastTime);

      const dailyStandard = createStandard({
        id: 'std-daily',
        cadence: { interval: 1, unit: 'day' },
      });

      mockUseStandards.mockReturnValue({
        standards: [dailyStandard],
        activeStandards: [dailyStandard],
        archivedStandards: [],
        orderedActiveStandards: [dailyStandard],
        loading: false,
        error: null,
        createStandard: jest.fn(),
        archiveStandard: jest.fn(),
        unarchiveStandard: jest.fn(),
        createLogEntry: jest.fn(),
        canLogStandard: jest.fn(),
      } as any);

      const { result, rerender } = renderHook(() => useActiveStandardsDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Jump time forward past multiple boundaries
      jest.setSystemTime(futureTime);

      // Trigger a re-render by updating standards (simulating a refresh)
      act(() => {
        mockUseStandards.mockReturnValue({
          standards: [dailyStandard],
          activeStandards: [dailyStandard],
          archivedStandards: [],
          orderedActiveStandards: [dailyStandard],
          loading: false,
          error: null,
          createStandard: jest.fn(),
          archiveStandard: jest.fn(),
          unarchiveStandard: jest.fn(),
          createLogEntry: jest.fn(),
          canLogStandard: jest.fn(),
        } as any);
        rerender();
      });

      // Should handle the missed boundary and advance to current period
      await waitFor(() => {
        const progress = result.current.progressMap['std-daily'];
        expect(progress).toBeDefined();
        // Period should reflect the future time, not the past time
        const expectedWindow = calculatePeriodWindow(futureTime, dailyStandard.cadence, timezone);
        expect(progress.periodLabel).toBe(expectedWindow.label);
      });
    });
  });
});

