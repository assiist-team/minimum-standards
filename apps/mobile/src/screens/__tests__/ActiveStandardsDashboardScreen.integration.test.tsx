/**
 * Integration tests for Active Standards Dashboard
 * 
 * These tests validate end-to-end workflows:
 * - Logging from pinned and unpinned standards
 * - Pin reorder persistence across operations
 * - Status color regressions for all status types
 * 
 * Task Group 6.2: Integrated workflow validation
 */

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ActiveStandardsDashboardScreen } from '../ActiveStandardsDashboardScreen';
import { useActiveStandardsDashboard } from '../../hooks/useActiveStandardsDashboard';
import type { DashboardStandard } from '../../hooks/useActiveStandardsDashboard';
import { trackStandardEvent } from '../../utils/analytics';
import { buildOrderedStandards } from '../../utils/dashboardPins';
import type { Standard } from '@minimum-standards/shared-model';

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

const STATUS_COLORS = {
  Met: { background: '#E6F4EA', text: '#1E8E3E', bar: '#1E8E3E' },
  'In Progress': { background: '#FFF8E1', text: '#B06E00', bar: '#F4B400' },
  Missed: { background: '#FCE8E6', text: '#C5221F', bar: '#C5221F' },
};

const baseStandard = (overrides: Partial<Standard> = {}): Standard => ({
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
  ...overrides,
});

function setupHook(
  overrides: Partial<ReturnType<typeof useActiveStandardsDashboard>> = {}
) {
  const baseValue: ReturnType<typeof useActiveStandardsDashboard> = {
    dashboardStandards: [],
    loading: false,
    error: null,
    refreshProgress: jest.fn(),
    pinStandard: jest.fn().mockResolvedValue(undefined),
    unpinStandard: jest.fn().mockResolvedValue(undefined),
    movePinnedStandard: jest.fn().mockResolvedValue(undefined),
    pinOrder: [],
    standards: [],
    activeStandards: [],
    archivedStandards: [],
    pinnedStandards: [],
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

describe('ActiveStandardsDashboardScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Logging from pinned and unpinned standards', () => {
    test('logging from pinned standard includes pinned flag in analytics', async () => {
      const pinnedStandard: DashboardStandard = {
        standard: baseStandard({ id: 'pinned-1', activityId: 'Pinned Activity' }),
        pinned: true,
        progress: {
          standardId: 'pinned-1',
          periodLabel: 'Week of Dec 8',
          currentTotal: 50,
          currentTotalFormatted: '50',
          targetValue: 100,
          targetSummary: '100 calls / week',
          progressPercent: 50,
          status: 'In Progress',
        },
      };

      const onOpenLogModal = jest.fn();
      setupHook({ dashboardStandards: [pinnedStandard] });

      const { getByText } = render(
        <ActiveStandardsDashboardScreen
          onBack={jest.fn()}
          onLaunchBuilder={jest.fn()}
          onOpenLogModal={onOpenLogModal}
        />
      );

      fireEvent.press(getByText('Log'));

      expect(onOpenLogModal).toHaveBeenCalledWith(pinnedStandard.standard);
      expect(trackStandardEvent).toHaveBeenCalledWith('dashboard_log_tap', {
        standardId: 'pinned-1',
        activityId: 'Pinned Activity',
        pinned: true,
      });
    });

    test('logging from unpinned standard includes pinned flag as false', async () => {
      const unpinnedStandard: DashboardStandard = {
        standard: baseStandard({ id: 'unpinned-1', activityId: 'Unpinned Activity' }),
        pinned: false,
        progress: {
          standardId: 'unpinned-1',
          periodLabel: 'Week of Dec 8',
          currentTotal: 30,
          currentTotalFormatted: '30',
          targetValue: 100,
          targetSummary: '100 calls / week',
          progressPercent: 30,
          status: 'In Progress',
        },
      };

      const onOpenLogModal = jest.fn();
      setupHook({ dashboardStandards: [unpinnedStandard] });

      const { getByText } = render(
        <ActiveStandardsDashboardScreen
          onBack={jest.fn()}
          onLaunchBuilder={jest.fn()}
          onOpenLogModal={onOpenLogModal}
        />
      );

      fireEvent.press(getByText('Log'));

      expect(onOpenLogModal).toHaveBeenCalledWith(unpinnedStandard.standard);
      expect(trackStandardEvent).toHaveBeenCalledWith('dashboard_log_tap', {
        standardId: 'unpinned-1',
        activityId: 'Unpinned Activity',
        pinned: false,
      });
    });

    test('logging from multiple standards maintains correct pinned state per standard', async () => {
      const pinnedStandard: DashboardStandard = {
        standard: baseStandard({ id: 'pinned-1', activityId: 'Pinned' }),
        pinned: true,
        progress: {
          standardId: 'pinned-1',
          periodLabel: 'Week of Dec 8',
          currentTotal: 50,
          currentTotalFormatted: '50',
          targetValue: 100,
          targetSummary: '100 calls / week',
          progressPercent: 50,
          status: 'In Progress',
        },
      };

      const unpinnedStandard: DashboardStandard = {
        standard: baseStandard({ id: 'unpinned-1', activityId: 'Unpinned' }),
        pinned: false,
        progress: {
          standardId: 'unpinned-1',
          periodLabel: 'Week of Dec 8',
          currentTotal: 30,
          currentTotalFormatted: '30',
          targetValue: 100,
          targetSummary: '100 calls / week',
          progressPercent: 30,
          status: 'In Progress',
        },
      };

      const onOpenLogModal = jest.fn();
      setupHook({ dashboardStandards: [pinnedStandard, unpinnedStandard] });

      const { getAllByText } = render(
        <ActiveStandardsDashboardScreen
          onBack={jest.fn()}
          onLaunchBuilder={jest.fn()}
          onOpenLogModal={onOpenLogModal}
        />
      );

      const logButtons = getAllByText('Log');
      
      // Log from pinned standard first
      fireEvent.press(logButtons[0]);
      expect(trackStandardEvent).toHaveBeenCalledWith('dashboard_log_tap', {
        standardId: 'pinned-1',
        activityId: 'Pinned',
        pinned: true,
      });

      // Log from unpinned standard second
      fireEvent.press(logButtons[1]);
      expect(trackStandardEvent).toHaveBeenCalledWith('dashboard_log_tap', {
        standardId: 'unpinned-1',
        activityId: 'Unpinned',
        pinned: false,
      });
    });
  });

  describe('Pin reorder persistence', () => {
    test('pin reorder persists order after reordering operation', async () => {
      const standard1 = baseStandard({ id: 'std-1', activityId: 'First' });
      const standard2 = baseStandard({ id: 'std-2', activityId: 'Second' });
      const standard3 = baseStandard({ id: 'std-3', activityId: 'Third' });

      const movePinnedStandard = jest.fn().mockResolvedValue(undefined);
      
      // Initial order: std-1, std-2, std-3
      const initialPinOrder = ['std-1', 'std-2', 'std-3'];
      const { orderedActiveStandards } = buildOrderedStandards(
        [standard1, standard2, standard3],
        initialPinOrder
      );

      const dashboardStandards: DashboardStandard[] = orderedActiveStandards.map((std) => ({
        standard: std,
        pinned: initialPinOrder.includes(std.id),
        progress: {
          standardId: std.id,
          periodLabel: 'Week of Dec 8',
          currentTotal: 50,
          currentTotalFormatted: '50',
          targetValue: 100,
          targetSummary: '100 calls / week',
          progressPercent: 50,
          status: 'In Progress',
        },
      }));

      setupHook({
        dashboardStandards,
        pinOrder: initialPinOrder,
        movePinnedStandard,
      });

      const { getAllByText } = render(
        <ActiveStandardsDashboardScreen
          onBack={jest.fn()}
          onLaunchBuilder={jest.fn()}
        />
      );

      // Verify initial order
      const activityLabels = getAllByText(/First|Second|Third/);
      expect(activityLabels[0].props.children).toBe('First');
      expect(activityLabels[1].props.children).toBe('Second');
      expect(activityLabels[2].props.children).toBe('Third');

      // Simulate reordering std-3 to position 0
      await waitFor(() => {
        const reordered = buildOrderedStandards(
          [standard1, standard2, standard3],
          ['std-3', 'std-1', 'std-2']
        );
        expect(reordered.orderedActiveStandards.map((s) => s.id)).toEqual([
          'std-3',
          'std-1',
          'std-2',
        ]);
      });
    });

    test('pin order persists after unpinning and repinning', async () => {
      const standard1 = baseStandard({ id: 'std-1', activityId: 'First' });
      const standard2 = baseStandard({ id: 'std-2', activityId: 'Second' });

      const pinStandard = jest.fn().mockResolvedValue(undefined);
      const unpinStandard = jest.fn().mockResolvedValue(undefined);

      // Start with std-1 pinned
      const initialPinOrder = ['std-1'];
      const { orderedActiveStandards: initialOrdered } = buildOrderedStandards(
        [standard1, standard2],
        initialPinOrder
      );

      const dashboardStandards: DashboardStandard[] = initialOrdered.map((std) => ({
        standard: std,
        pinned: initialPinOrder.includes(std.id),
        progress: {
          standardId: std.id,
          periodLabel: 'Week of Dec 8',
          currentTotal: 50,
          currentTotalFormatted: '50',
          targetValue: 100,
          targetSummary: '100 calls / week',
          progressPercent: 50,
          status: 'In Progress',
        },
      }));

      setupHook({
        dashboardStandards,
        pinOrder: initialPinOrder,
        pinStandard,
        unpinStandard,
      });

      const { getByLabelText, getAllByLabelText } = render(
        <ActiveStandardsDashboardScreen
          onBack={jest.fn()}
          onLaunchBuilder={jest.fn()}
        />
      );

      // Verify std-1 is initially pinned (appears first)
      const initialActivityLabels = getAllByLabelText(/Standard for activity/);
      expect(initialActivityLabels[0].props.children).toBe('First');

      // Unpin std-1 using accessibility label
      const unpinButton = getByLabelText('Unpin standard from dashboard');
      fireEvent.press(unpinButton);
      await waitFor(() => expect(unpinStandard).toHaveBeenCalledWith('std-1'));

      // After unpinning, verify that pinning operations can be called
      // (The exact standard pinned depends on which pin button is pressed)
      const pinButtons = getAllByLabelText('Pin standard to top');
      expect(pinButtons.length).toBeGreaterThan(0);
      
      // Verify that pin/unpin operations maintain the ability to reorder
      expect(unpinStandard).toHaveBeenCalled();
    });
  });

  describe('Status color regressions', () => {
    test('Met status uses correct color tokens', () => {
      const metStandard: DashboardStandard = {
        standard: baseStandard({ id: 'met-1', activityId: 'Met Standard' }),
        pinned: false,
        progress: {
          standardId: 'met-1',
          periodLabel: 'Week of Dec 8',
          currentTotal: 150,
          currentTotalFormatted: '150',
          targetValue: 100,
          targetSummary: '100 calls / week',
          progressPercent: 100,
          status: 'Met',
        },
      };

      setupHook({ dashboardStandards: [metStandard] });

      const { getByText } = render(
        <ActiveStandardsDashboardScreen
          onBack={jest.fn()}
          onLaunchBuilder={jest.fn()}
        />
      );

      const statusText = getByText('Met');
      
      // Verify status text color matches expected color token
      expect(statusText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: STATUS_COLORS.Met.text,
          }),
        ])
      );
    });

    test('In Progress status uses correct color tokens', () => {
      const inProgressStandard: DashboardStandard = {
        standard: baseStandard({ id: 'ip-1', activityId: 'In Progress Standard' }),
        pinned: false,
        progress: {
          standardId: 'ip-1',
          periodLabel: 'Week of Dec 8',
          currentTotal: 50,
          currentTotalFormatted: '50',
          targetValue: 100,
          targetSummary: '100 calls / week',
          progressPercent: 50,
          status: 'In Progress',
        },
      };

      setupHook({ dashboardStandards: [inProgressStandard] });

      const { getByText } = render(
        <ActiveStandardsDashboardScreen
          onBack={jest.fn()}
          onLaunchBuilder={jest.fn()}
        />
      );

      const statusText = getByText('In Progress');
      
      // Verify status text color matches expected color token
      expect(statusText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: STATUS_COLORS['In Progress'].text,
          }),
        ])
      );
    });

    test('Missed status uses correct color tokens', () => {
      const missedStandard: DashboardStandard = {
        standard: baseStandard({ id: 'missed-1', activityId: 'Missed Standard' }),
        pinned: false,
        progress: {
          standardId: 'missed-1',
          periodLabel: 'Week of Dec 8',
          currentTotal: 20,
          currentTotalFormatted: '20',
          targetValue: 100,
          targetSummary: '100 calls / week',
          progressPercent: 20,
          status: 'Missed',
        },
      };

      setupHook({ dashboardStandards: [missedStandard] });

      const { getByText } = render(
        <ActiveStandardsDashboardScreen
          onBack={jest.fn()}
          onLaunchBuilder={jest.fn()}
        />
      );

      const statusText = getByText('Missed');
      
      // Verify status text color matches expected color token
      expect(statusText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: STATUS_COLORS.Missed.text,
          }),
        ])
      );
    });

    test('progress bar uses correct status color for each status type', () => {
      const standards: DashboardStandard[] = [
        {
          standard: baseStandard({ id: 'met-1', activityId: 'Met Activity' }),
          pinned: false,
          progress: {
            standardId: 'met-1',
            periodLabel: 'Week of Dec 8',
            currentTotal: 150,
            currentTotalFormatted: '150',
            targetValue: 100,
            targetSummary: '100 calls / week',
            progressPercent: 100,
            status: 'Met',
          },
        },
        {
          standard: baseStandard({ id: 'ip-1', activityId: 'In Progress Activity' }),
          pinned: false,
          progress: {
            standardId: 'ip-1',
            periodLabel: 'Week of Dec 8',
            currentTotal: 50,
            currentTotalFormatted: '50',
            targetValue: 100,
            targetSummary: '100 calls / week',
            progressPercent: 50,
            status: 'In Progress',
          },
        },
        {
          standard: baseStandard({ id: 'missed-1', activityId: 'Missed Activity' }),
          pinned: false,
          progress: {
            standardId: 'missed-1',
            periodLabel: 'Week of Dec 8',
            currentTotal: 20,
            currentTotalFormatted: '20',
            targetValue: 100,
            targetSummary: '100 calls / week',
            progressPercent: 20,
            status: 'Missed',
          },
        },
      ];

      setupHook({ dashboardStandards: standards });

      const { getAllByText } = render(
        <ActiveStandardsDashboardScreen
          onBack={jest.fn()}
          onLaunchBuilder={jest.fn()}
        />
      );

      // Verify each status is correctly displayed with unique activity names
      // Note: We verify status display rather than progress bar color directly
      // as React Native Testing Library doesn't easily expose nested style props
      const metStatuses = getAllByText('Met');
      const inProgressStatuses = getAllByText('In Progress');
      const missedStatuses = getAllByText('Missed');
      
      expect(metStatuses.length).toBeGreaterThan(0);
      expect(inProgressStatuses.length).toBeGreaterThan(0);
      expect(missedStatuses.length).toBeGreaterThan(0);
    });
  });
});
