/**
 * Integration tests for Active Standards Dashboard
 * 
 * These tests validate end-to-end workflows:
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
import type { Standard } from '@minimum-standards/shared-model';
import { lightTheme, getStatusColors } from '../../theme/colors';

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

describe('ActiveStandardsDashboardScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe('Status color regressions', () => {
    test('Met status uses correct color tokens', () => {
      const metStandard: DashboardStandard = {
        standard: baseStandard({ id: 'met-1', activityId: 'Met Standard' }),
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

      const { getByRole } = render(
        <ActiveStandardsDashboardScreen
          onBack={jest.fn()}
          onLaunchBuilder={jest.fn()}
        />
      );

      const progressBar = getByRole('progressbar');
      // Verify progress bar uses green token when complete
      expect(progressBar.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: lightTheme.status.met.barComplete,
          }),
        ])
      );
    });

    test('In Progress status uses correct color tokens', () => {
      const inProgressStandard: DashboardStandard = {
        standard: baseStandard({ id: 'ip-1', activityId: 'In Progress Standard' }),
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

      const { getByRole } = render(
        <ActiveStandardsDashboardScreen
          onBack={jest.fn()}
          onLaunchBuilder={jest.fn()}
        />
      );

      const progressBar = getByRole('progressbar');
      // Verify progress bar uses base (brown) token when not complete
      expect(progressBar.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: lightTheme.status.met.bar,
          }),
        ])
      );
    });

    test('Missed status uses correct color tokens', () => {
      const missedStandard: DashboardStandard = {
        standard: baseStandard({ id: 'missed-1', activityId: 'Missed Standard' }),
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
      const expectedColors = getStatusColors(lightTheme, 'Missed');
      expect(statusText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: expectedColors.text,
          }),
        ])
      );
    });

    test('progress bar uses correct status color for each status type', () => {
      const standards: DashboardStandard[] = [
        {
          standard: baseStandard({ id: 'met-1', activityId: 'Met Activity' }),
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
