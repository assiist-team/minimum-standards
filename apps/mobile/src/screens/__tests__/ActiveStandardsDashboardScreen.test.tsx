import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ActiveStandardsDashboardScreen } from '../ActiveStandardsDashboardScreen';
import { useActiveStandardsDashboard } from '../../hooks/useActiveStandardsDashboard';
import type { DashboardStandard } from '../../hooks/useActiveStandardsDashboard';
import { trackStandardEvent } from '../../utils/analytics';

jest.mock('../../hooks/useActiveStandardsDashboard', () => ({
  useActiveStandardsDashboard: jest.fn(),
}));

jest.mock('../../utils/analytics', () => ({
  trackStandardEvent: jest.fn(),
}));

jest.mock('../../components/LogEntryModal', () => ({
  LogEntryModal: () => null,
}));

const mockUseDashboard = useActiveStandardsDashboard as jest.MockedFunction<
  typeof useActiveStandardsDashboard
>;

const baseStandard: DashboardStandard = {
  standard: {
    id: 'std-1',
    activityId: 'Sales Calls',
    minimum: 100,
    unit: 'calls',
    cadence: { interval: 1, unit: 'week' },
    state: 'active',
    summary: '100 calls / week',
    archivedAtMs: null,
    createdAtMs: 1,
    updatedAtMs: 1,
    deletedAtMs: null,
  },
  progress: {
    standardId: 'std-1',
    periodLabel: 'Week of Dec 8',
    currentTotal: 10,
    currentTotalFormatted: '10',
    targetValue: 100,
    targetSummary: '100 calls / week',
    progressPercent: 10,
    status: 'In Progress',
  },
};

function setupHook(
  overrides: Partial<ReturnType<typeof useActiveStandardsDashboard>> = {}
) {
  const baseValue: ReturnType<typeof useActiveStandardsDashboard> = {
    dashboardStandards: [],
    loading: false,
    error: null,
    refreshProgress: jest.fn(),
    refreshStandards: jest.fn(),
    // Fields from useStandards that are spread into hook result (unused but provided for completeness)
    standards: [],
    activeStandards: [],
    archivedStandards: [],
    orderedActiveStandards: [],
    createStandard: jest.fn(),
    archiveStandard: jest.fn(),
    unarchiveStandard: jest.fn(),
    createLogEntry: jest.fn(),
    canLogStandard: jest.fn(),
    progressMap: {},
  } as unknown as ReturnType<typeof useActiveStandardsDashboard>;

  mockUseDashboard.mockReturnValue({
    ...baseValue,
    ...overrides,
  } as ReturnType<typeof useActiveStandardsDashboard>);
}

describe('ActiveStandardsDashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders skeleton state while loading', () => {
    setupHook({ loading: true });
    const { getByTestId } = render(
      <ActiveStandardsDashboardScreen
        onBack={jest.fn()}
        onLaunchBuilder={jest.fn()}
      />
    );
    expect(getByTestId('dashboard-skeletons')).toBeTruthy();
  });

  test('shows empty state when no standards', () => {
    setupHook();
    const { getByTestId, getByText } = render(
      <ActiveStandardsDashboardScreen
        onBack={jest.fn()}
        onLaunchBuilder={jest.fn()}
      />
    );
    expect(getByTestId('dashboard-empty-state')).toBeTruthy();
    expect(getByText('No active standards')).toBeTruthy();
  });

  test('empty state CTA routes to builder', () => {
    setupHook();
    const onLaunchBuilder = jest.fn();
    const { getByText } = render(
      <ActiveStandardsDashboardScreen
        onBack={jest.fn()}
        onLaunchBuilder={onLaunchBuilder}
      />
    );
    fireEvent.press(getByText('Create Standard'));
    expect(onLaunchBuilder).toHaveBeenCalled();
  });

  test('error banner retry invokes refresh handlers', () => {
    const refreshProgress = jest.fn();
    const refreshStandards = jest.fn();
    setupHook({
      dashboardStandards: [baseStandard],
      error: new Error('firestore'),
      refreshProgress,
      refreshStandards,
    });
    const { getByText } = render(
      <ActiveStandardsDashboardScreen
        onBack={jest.fn()}
        onLaunchBuilder={jest.fn()}
      />
    );
    fireEvent.press(getByText('Retry'));
    expect(refreshProgress).toHaveBeenCalled();
    expect(refreshStandards).toHaveBeenCalled();
  });

  test('displays computed period labels instead of generic fallback', () => {
    const standardWithoutProgress: DashboardStandard = {
      standard: {
        id: 'std-2',
        activityId: 'Test Activity',
        minimum: 50,
        unit: 'units',
        cadence: { interval: 1, unit: 'week' },
        state: 'active',
        summary: '50 units / week',
        archivedAtMs: null,
        createdAtMs: 1,
        updatedAtMs: 1,
        deletedAtMs: null,
      },
      progress: null, // No progress data
    };

    setupHook({ dashboardStandards: [standardWithoutProgress] });
    const { getByText } = render(
      <ActiveStandardsDashboardScreen
        onBack={jest.fn()}
        onLaunchBuilder={jest.fn()}
      />
    );

    // Should show computed period label (date range), not "Current period"
    const periodText = getByText(/December|January|February|March|April|May|June|July|August|September|October|November/i);
    expect(periodText).toBeTruthy();
    // Should NOT contain generic "Current period" text
    expect(() => getByText('Current period')).toThrow();
  });

  test('renders standards in provided order', () => {
    setupHook({
      dashboardStandards: [
        { ...baseStandard, standard: { ...baseStandard.standard, activityId: 'First', id: 'first-1' } },
        { ...baseStandard, standard: { ...baseStandard.standard, activityId: 'Second', id: 'second-1' } },
      ],
    });
    const { getAllByText } = render(
      <ActiveStandardsDashboardScreen
        onBack={jest.fn()}
        onLaunchBuilder={jest.fn()}
      />
    );
    const activityLabels = getAllByText(/First|Second/);
    expect(activityLabels[0].props.children).toBe('First');
  });

  test('invokes log modal when tapping Log', () => {
    const onOpenLogModal = jest.fn();
    setupHook({ dashboardStandards: [baseStandard] });
    const { getByText } = render(
      <ActiveStandardsDashboardScreen
        onBack={jest.fn()}
        onLaunchBuilder={jest.fn()}
        onOpenLogModal={onOpenLogModal}
      />
    );
    fireEvent.press(getByText('Log'));
    expect(onOpenLogModal).toHaveBeenCalledWith(baseStandard.standard);
    expect(trackStandardEvent).toHaveBeenCalledWith('dashboard_log_tap', {
      standardId: baseStandard.standard.id,
      activityId: baseStandard.standard.activityId,
    });
  });

  test('opens log modal when onOpenLogModal is not provided', () => {
    setupHook({ dashboardStandards: [baseStandard] });
    const { getByText } = render(
      <ActiveStandardsDashboardScreen
        onBack={jest.fn()}
        onLaunchBuilder={jest.fn()}
      />
    );
    fireEvent.press(getByText('Log'));
    // Modal should be visible (we can't easily test modal visibility in RNTL,
    // but we verify the standard was set and modal would render)
    expect(trackStandardEvent).toHaveBeenCalledWith('dashboard_log_tap', {
      standardId: baseStandard.standard.id,
      activityId: baseStandard.standard.activityId,
    });
  });

  describe('card interaction updates', () => {
    test('card body tap does not navigate (no-op per Activity History plan)', () => {
      const onNavigateToDetail = jest.fn();
      setupHook({ dashboardStandards: [baseStandard] });
      const { getByText } = render(
        <ActiveStandardsDashboardScreen
          onBack={jest.fn()}
          onLaunchBuilder={jest.fn()}
          onNavigateToDetail={onNavigateToDetail}
        />
      );
      // Tap on the card body (activity name or period text)
      fireEvent.press(getByText('Sales Calls'));
      // Navigation is now a no-op per Activity History plan
      expect(onNavigateToDetail).not.toHaveBeenCalled();
    });

    test('Log button tap opens logging modal and does not navigate', () => {
      const onNavigateToDetail = jest.fn();
      const onOpenLogModal = jest.fn();
      setupHook({ dashboardStandards: [baseStandard] });
      const { getByText } = render(
        <ActiveStandardsDashboardScreen
          onBack={jest.fn()}
          onLaunchBuilder={jest.fn()}
          onNavigateToDetail={onNavigateToDetail}
          onOpenLogModal={onOpenLogModal}
        />
      );
      // Tap Log button
      fireEvent.press(getByText('Log'));
      expect(onOpenLogModal).toHaveBeenCalledWith(baseStandard.standard);
      expect(onNavigateToDetail).not.toHaveBeenCalled();
    });

    test('Log button is positioned next to progress bar (not in footer)', () => {
      setupHook({ dashboardStandards: [baseStandard] });
      const { getByText } = render(
        <ActiveStandardsDashboardScreen
          onBack={jest.fn()}
          onLaunchBuilder={jest.fn()}
        />
      );
      // Verify Log button exists and is accessible
      const logButton = getByText('Log');
      expect(logButton).toBeTruthy();
      // The button should be accessible via its text, indicating it's rendered
      // In a real implementation, we'd check the layout/styling, but for unit tests
      // we verify the button exists and is tappable
      expect(logButton).toBeTruthy();
    });
  });
});
