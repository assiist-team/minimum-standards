import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useStandardsLibrary } from '../useStandardsLibrary';
import { useStandards } from '../useStandards';
import { Standard } from '@minimum-standards/shared-model';

// Mock useStandards hook
jest.mock('../useStandards');

const mockUseStandards = useStandards as jest.MockedFunction<typeof useStandards>;

const mockStandard1: Standard = {
  id: '1',
  activityId: 'activity1',
  minimum: 1000,
  unit: 'calls',
  cadence: { interval: 1, unit: 'week' },
  state: 'active',
  summary: '1000 calls / week',
  archivedAtMs: null,
  createdAtMs: 1000,
  updatedAtMs: 1000,
  deletedAtMs: null,
};

const mockStandard2: Standard = {
  id: '2',
  activityId: 'activity2',
  minimum: 50,
  unit: 'minutes',
  cadence: { interval: 1, unit: 'day' },
  state: 'archived',
  summary: '50 minutes / day',
  archivedAtMs: 2000,
  createdAtMs: 2000,
  updatedAtMs: 2000,
  deletedAtMs: null,
};

const mockStandard3: Standard = {
  id: '3',
  activityId: 'activity1',
  minimum: 100,
  unit: 'workouts',
  cadence: { interval: 3, unit: 'week' },
  state: 'active',
  summary: '100 workouts / 3 weeks',
  archivedAtMs: null,
  createdAtMs: 3000,
  updatedAtMs: 3000,
  deletedAtMs: null,
};

describe('useStandardsLibrary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('exposes all standards, active, and archived arrays', () => {
    mockUseStandards.mockReturnValue({
      standards: [mockStandard1, mockStandard2, mockStandard3],
      activeStandards: [mockStandard1, mockStandard3],
      archivedStandards: [mockStandard2],
      pinnedStandards: [],
      orderedActiveStandards: [],
      pinOrder: [],
      loading: false,
      error: null,
      createStandard: jest.fn(),
      archiveStandard: jest.fn(),
      unarchiveStandard: jest.fn(),
      createLogEntry: jest.fn(),
      updateLogEntry: jest.fn(),
      deleteLogEntry: jest.fn(),
      restoreLogEntry: jest.fn(),
      canLogStandard: jest.fn(),
      pinStandard: jest.fn(),
      unpinStandard: jest.fn(),
      movePinnedStandard: jest.fn(),
    });

    const { result } = renderHook(() => useStandardsLibrary());

    expect(result.current.allStandards).toEqual([
      mockStandard1,
      mockStandard2,
      mockStandard3,
    ]);
    expect(result.current.activeStandards).toEqual([
      mockStandard3, // Sorted alphabetically
      mockStandard1,
    ]);
    expect(result.current.archivedStandards).toEqual([mockStandard2]);
  });

  it('debounces search query updates', async () => {
    mockUseStandards.mockReturnValue({
      standards: [mockStandard1, mockStandard2, mockStandard3],
      activeStandards: [],
      archivedStandards: [],
      pinnedStandards: [],
      orderedActiveStandards: [],
      pinOrder: [],
      loading: false,
      error: null,
      createStandard: jest.fn(),
      archiveStandard: jest.fn(),
      unarchiveStandard: jest.fn(),
      createLogEntry: jest.fn(),
      updateLogEntry: jest.fn(),
      deleteLogEntry: jest.fn(),
      restoreLogEntry: jest.fn(),
      canLogStandard: jest.fn(),
      pinStandard: jest.fn(),
      unpinStandard: jest.fn(),
      movePinnedStandard: jest.fn(),
    });

    const { result } = renderHook(() => useStandardsLibrary());

    // Initially, all active standards should be shown
    expect(result.current.activeStandards.length).toBe(2);

    // Set search query
    act(() => {
      result.current.setSearchQuery('calls');
    });

    // Input value is returned immediately
    expect(result.current.searchQuery).toBe('calls');
    // But filtering hasn't happened yet (debounced)
    expect(result.current.activeStandards.length).toBe(2);

    // Fast-forward time by 300ms
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      // After debounce, filtered results should appear
      expect(result.current.activeStandards.length).toBe(1);
      expect(result.current.activeStandards[0].summary).toBe('1000 calls / week');
    });
  });

  it('filters standards by search query', async () => {
    mockUseStandards.mockReturnValue({
      standards: [mockStandard1, mockStandard2, mockStandard3],
      activeStandards: [],
      archivedStandards: [],
      pinnedStandards: [],
      orderedActiveStandards: [],
      pinOrder: [],
      loading: false,
      error: null,
      createStandard: jest.fn(),
      archiveStandard: jest.fn(),
      unarchiveStandard: jest.fn(),
      createLogEntry: jest.fn(),
      updateLogEntry: jest.fn(),
      deleteLogEntry: jest.fn(),
      restoreLogEntry: jest.fn(),
      canLogStandard: jest.fn(),
      pinStandard: jest.fn(),
      unpinStandard: jest.fn(),
      movePinnedStandard: jest.fn(),
    });

    const { result } = renderHook(() => useStandardsLibrary());

    act(() => {
      result.current.setSearchQuery('minutes');
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.archivedStandards.length).toBe(1);
      expect(result.current.archivedStandards[0].summary).toBe('50 minutes / day');
      expect(result.current.activeStandards.length).toBe(0);
    });
  });

  it('filters active and archived standards correctly', () => {
    mockUseStandards.mockReturnValue({
      standards: [mockStandard1, mockStandard2, mockStandard3],
      activeStandards: [],
      archivedStandards: [],
      pinnedStandards: [],
      orderedActiveStandards: [],
      pinOrder: [],
      loading: false,
      error: null,
      createStandard: jest.fn(),
      archiveStandard: jest.fn(),
      unarchiveStandard: jest.fn(),
      createLogEntry: jest.fn(),
      updateLogEntry: jest.fn(),
      deleteLogEntry: jest.fn(),
      restoreLogEntry: jest.fn(),
      canLogStandard: jest.fn(),
      pinStandard: jest.fn(),
      unpinStandard: jest.fn(),
      movePinnedStandard: jest.fn(),
    });

    const { result } = renderHook(() => useStandardsLibrary());

    expect(result.current.activeStandards).toEqual([
      mockStandard3, // Sorted alphabetically
      mockStandard1,
    ]);
    expect(result.current.archivedStandards).toEqual([mockStandard2]);
  });

  it('exposes archive and unarchive functions', () => {
    const mockArchiveStandard = jest.fn();
    const mockUnarchiveStandard = jest.fn();

    mockUseStandards.mockReturnValue({
      standards: [mockStandard1],
      activeStandards: [],
      archivedStandards: [],
      pinnedStandards: [],
      orderedActiveStandards: [],
      pinOrder: [],
      loading: false,
      error: null,
      createStandard: jest.fn(),
      archiveStandard: mockArchiveStandard,
      unarchiveStandard: mockUnarchiveStandard,
      createLogEntry: jest.fn(),
      updateLogEntry: jest.fn(),
      deleteLogEntry: jest.fn(),
      restoreLogEntry: jest.fn(),
      canLogStandard: jest.fn(),
      pinStandard: jest.fn(),
      unpinStandard: jest.fn(),
      movePinnedStandard: jest.fn(),
    });

    const { result } = renderHook(() => useStandardsLibrary());

    result.current.archiveStandard('1');
    expect(mockArchiveStandard).toHaveBeenCalledWith('1');

    result.current.unarchiveStandard('2');
    expect(mockUnarchiveStandard).toHaveBeenCalledWith('2');
  });

  it('exposes loading and error states', () => {
    mockUseStandards.mockReturnValue({
      standards: [],
      activeStandards: [],
      archivedStandards: [],
      pinnedStandards: [],
      orderedActiveStandards: [],
      pinOrder: [],
      loading: true,
      error: new Error('Test error'),
      createStandard: jest.fn(),
      archiveStandard: jest.fn(),
      unarchiveStandard: jest.fn(),
      createLogEntry: jest.fn(),
      updateLogEntry: jest.fn(),
      deleteLogEntry: jest.fn(),
      restoreLogEntry: jest.fn(),
      canLogStandard: jest.fn(),
      pinStandard: jest.fn(),
      unpinStandard: jest.fn(),
      movePinnedStandard: jest.fn(),
    });

    const { result } = renderHook(() => useStandardsLibrary());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toEqual(new Error('Test error'));
  });
});
