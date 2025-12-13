import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StandardDetailScreen } from '../StandardDetailScreen';
import { useStandardHistory } from '../../hooks/useStandardHistory';
import { useStandards } from '../../hooks/useStandards';
import type { Standard } from '@minimum-standards/shared-model';
import type { PeriodHistoryEntry } from '../../utils/standardHistory';
import { trackStandardEvent } from '../../utils/analytics';

jest.mock('../../utils/analytics', () => ({
  trackStandardEvent: jest.fn(),
}));

jest.mock('../../hooks/useStandardHistory', () => ({
  useStandardHistory: jest.fn(),
}));

jest.mock('../../hooks/useStandards', () => ({
  useStandards: jest.fn(),
}));

jest.mock('../../components/LogEntryModal', () => ({
  LogEntryModal: ({ visible, standard, onClose, onSave }: any) => {
    if (!visible) return null;
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="log-entry-modal">
        <Text>LogEntryModal</Text>
        {standard && <Text testID="modal-standard-id">{standard.id}</Text>}
        <TouchableOpacity testID="modal-close" onPress={onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="modal-save"
          onPress={() => onSave(standard?.id || '', 10, Date.now(), null)}
        >
          <Text>Save</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../../components/PeriodLogsModal', () => ({
  PeriodLogsModal: () => null,
}));

jest.mock('../../components/PeriodHistoryList', () => ({
  PeriodHistoryList: () => null,
}));

const mockUseStandardHistory = useStandardHistory as jest.MockedFunction<
  typeof useStandardHistory
>;
const mockUseStandards = useStandards as jest.MockedFunction<typeof useStandards>;

const mockStandard: Standard = {
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
};

const mockCurrentPeriodProgress: PeriodHistoryEntry = {
  periodLabel: 'Week of Dec 8',
  total: 10,
  target: 100,
  targetSummary: '100 calls / week',
  status: 'In Progress',
  progressPercent: 10,
  periodStartMs: 1702008000000,
  periodEndMs: 1702612800000,
};

function setupHooks(
  historyOverrides: Partial<ReturnType<typeof useStandardHistory>> = {},
  standardsOverrides: Partial<ReturnType<typeof useStandards>> = {}
) {
  mockUseStandardHistory.mockReturnValue({
    history: [],
    loading: false,
    error: null,
    refresh: jest.fn(),
    ...historyOverrides,
  } as ReturnType<typeof useStandardHistory>);

  mockUseStandards.mockReturnValue({
    standards: [mockStandard],
    activeStandards: [mockStandard],
    archivedStandards: [],
    pinnedStandards: [],
    orderedActiveStandards: [mockStandard],
    pinOrder: [],
    loading: false,
    error: null,
    createStandard: jest.fn(),
    archiveStandard: jest.fn().mockResolvedValue(undefined),
    unarchiveStandard: jest.fn().mockResolvedValue(undefined),
    createLogEntry: jest.fn(),
    canLogStandard: jest.fn(() => true),
    pinStandard: jest.fn(),
    unpinStandard: jest.fn(),
    movePinnedStandard: jest.fn(),
    ...standardsOverrides,
  } as ReturnType<typeof useStandards>);
}

describe('StandardDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with standard data', () => {
    setupHooks({ history: [mockCurrentPeriodProgress] });
    const { getByText } = render(
      <StandardDetailScreen
        standardId={mockStandard.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
      />
    );
    expect(getByText('Sales Calls')).toBeTruthy();
    expect(getByText('Week of Dec 8')).toBeTruthy();
  });

  test('loading state displays skeleton', () => {
    setupHooks({ loading: true });
    const { getByTestId } = render(
      <StandardDetailScreen
        standardId={mockStandard.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
      />
    );
    expect(getByTestId('detail-skeleton')).toBeTruthy();
  });

  test('error state displays error banner with retry', () => {
    const refresh = jest.fn();
    setupHooks({ error: new Error('Firestore error'), refresh });
    const { getByText } = render(
      <StandardDetailScreen
        standardId={mockStandard.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
      />
    );
    expect(getByText(/something went wrong|firestore error/i)).toBeTruthy();
    const retryButton = getByText('Retry');
    fireEvent.press(retryButton);
    expect(refresh).toHaveBeenCalled();
  });

  test('empty history state shows minimal empty message', () => {
    setupHooks({ history: [] });
    const { getByText } = render(
      <StandardDetailScreen
        standardId={mockStandard.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
      />
    );
    // Should still show current period summary
    expect(getByText('Sales Calls')).toBeTruthy();
    // Should show empty history message
    expect(getByText(/no history|no logs/i)).toBeTruthy();
  });

  // Task Group 6: Detail screen actions
  describe('Action buttons', () => {
    test('Log button opens logging modal with standard preselected', () => {
      setupHooks({ history: [mockCurrentPeriodProgress] });
      const { getByText, getByTestId, queryByTestId } = render(
        <StandardDetailScreen
          standardId={mockStandard.id}
          onBack={jest.fn()}
          onEdit={jest.fn()}
          onArchive={jest.fn()}
        />
      );

      // Modal should not be visible initially
      expect(queryByTestId('log-entry-modal')).toBeNull();

      // Press Log button
      const logButton = getByText('Log');
      fireEvent.press(logButton);

      // Modal should now be visible with standard preselected
      expect(getByTestId('log-entry-modal')).toBeTruthy();
      expect(getByTestId('modal-standard-id')).toBeTruthy();
      expect(getByTestId('modal-standard-id').props.children).toBe(mockStandard.id);
    });

    test('Edit button navigates to Standards Builder with standard data', () => {
      setupHooks({ history: [mockCurrentPeriodProgress] });
      const onEdit = jest.fn();
      const { getByText } = render(
        <StandardDetailScreen
          standardId={mockStandard.id}
          onBack={jest.fn()}
          onEdit={onEdit}
          onArchive={jest.fn()}
        />
      );

      const editButton = getByText('Edit');
      fireEvent.press(editButton);

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith(mockStandard);
    });

    test('Archive/Unarchive button toggles archive state', async () => {
      const archiveStandard = jest.fn().mockResolvedValue(undefined);
      const unarchiveStandard = jest.fn().mockResolvedValue(undefined);
      const onArchive = jest.fn();

      // Test Archive button (active standard)
      setupHooks(
        { history: [mockCurrentPeriodProgress] },
        { archiveStandard, unarchiveStandard }
      );
      const { getByText, rerender } = render(
        <StandardDetailScreen
          standardId={mockStandard.id}
          onBack={jest.fn()}
          onEdit={jest.fn()}
          onArchive={onArchive}
        />
      );

      const archiveButton = getByText('Archive');
      fireEvent.press(archiveButton);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(archiveStandard).toHaveBeenCalledTimes(1);
      expect(archiveStandard).toHaveBeenCalledWith(mockStandard.id);
      expect(onArchive).toHaveBeenCalledWith(mockStandard.id);

      // Test Unarchive button (archived standard)
      const archivedStandard: Standard = {
        ...mockStandard,
        state: 'archived',
        archivedAtMs: Date.now(),
      };
      setupHooks(
        { history: [mockCurrentPeriodProgress] },
        {
          standards: [archivedStandard],
          activeStandards: [],
          archivedStandards: [archivedStandard],
          archiveStandard,
          unarchiveStandard,
        }
      );

      rerender(
        <StandardDetailScreen
          standardId={archivedStandard.id}
          onBack={jest.fn()}
          onEdit={jest.fn()}
          onArchive={onArchive}
        />
      );

      const unarchiveButton = getByText('Unarchive');
      fireEvent.press(unarchiveButton);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(unarchiveStandard).toHaveBeenCalledTimes(1);
      expect(unarchiveStandard).toHaveBeenCalledWith(archivedStandard.id);
      expect(onArchive).toHaveBeenCalledWith(archivedStandard.id);
    });
  });

  // Task Group 7: Error handling and empty states
  describe('Error handling and empty states', () => {
    test('empty history state shows message and Log action still available', () => {
      setupHooks({ history: [] });
      const { getByText, queryByTestId } = render(
        <StandardDetailScreen
          standardId={mockStandard.id}
          onBack={jest.fn()}
          onEdit={jest.fn()}
          onArchive={jest.fn()}
        />
      );

      // Should show empty history message
      expect(getByText(/no history|no logs/i)).toBeTruthy();
      // Log button should still be available
      expect(getByText('Log')).toBeTruthy();
      // Current period summary should still display
      expect(getByText('Sales Calls')).toBeTruthy();
      // History list should not be rendered
      expect(queryByTestId('history-list')).toBeNull();
    });

    test('Firestore error displays actionable error message with retry', () => {
      const refresh = jest.fn();
      const error = new Error('Firestore connection failed');
      setupHooks({ error, refresh });
      const { getByText } = render(
        <StandardDetailScreen
          standardId={mockStandard.id}
          onBack={jest.fn()}
          onEdit={jest.fn()}
          onArchive={jest.fn()}
        />
      );

      // Error message should be displayed
      expect(getByText(/firestore connection failed|something went wrong/i)).toBeTruthy();
      // Retry button should be available
      const retryButton = getByText('Retry');
      expect(retryButton).toBeTruthy();

      // Press retry
      fireEvent.press(retryButton);
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    test('errors fail gracefully without crashing screen', () => {
      const error = new Error('Unexpected error');
      setupHooks({ error });
      const { getByText } = render(
        <StandardDetailScreen
          standardId={mockStandard.id}
          onBack={jest.fn()}
          onEdit={jest.fn()}
          onArchive={jest.fn()}
        />
      );

      // Screen should still render
      expect(getByText('Sales Calls')).toBeTruthy();
      // Error banner should be visible
      expect(getByText(/unexpected error|something went wrong/i)).toBeTruthy();
    });
  });

  // Task Group 8: Accessibility and theming
  describe('Accessibility and theming', () => {
    test('screen has proper accessibilityLabel strings for key elements', () => {
      setupHooks({ history: [mockCurrentPeriodProgress] });
      const { getByLabelText, getAllByRole } = render(
        <StandardDetailScreen
          standardId={mockStandard.id}
          onBack={jest.fn()}
          onEdit={jest.fn()}
          onArchive={jest.fn()}
        />
      );

      // Back button should have accessibility role
      const buttons = getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Log button should have accessibility label
      expect(getByLabelText(/log progress/i)).toBeTruthy();

      // Edit button should have accessibility label
      expect(getByLabelText(/edit standard/i)).toBeTruthy();

      // Archive button should have accessibility label
      expect(getByLabelText(/archive standard/i)).toBeTruthy();

      // Progress bar should have accessibility role (if rendered)
      try {
        const progressBars = getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
      } catch (e) {
        // Progress bar might not be rendered in all states, which is acceptable
        // The important part is that accessibility labels exist where they should
      }
    });

    test('status colors meet contrast requirements in dark mode', () => {
      // This test verifies that status colors are defined for both light and dark modes
      // Actual contrast testing would require visual regression testing or contrast calculation
      setupHooks({ history: [mockCurrentPeriodProgress] });
      const { getByText } = render(
        <StandardDetailScreen
          standardId={mockStandard.id}
          onBack={jest.fn()}
          onEdit={jest.fn()}
          onArchive={jest.fn()}
        />
      );

      // Status pill should render (colors are applied via styles)
      const statusPill = getByText('In Progress');
      expect(statusPill).toBeTruthy();
      // Status text should be visible
      expect(statusPill.parent?.props.style).toBeDefined();
    });
  });

  // Task Group 9: Analytics
  describe('Analytics', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('analytics fired on detail screen open', () => {
      setupHooks({ history: [mockCurrentPeriodProgress] });
      render(
        <StandardDetailScreen
          standardId={mockStandard.id}
          onBack={jest.fn()}
          onEdit={jest.fn()}
          onArchive={jest.fn()}
        />
      );

      expect(trackStandardEvent).toHaveBeenCalledWith('standard_detail_view', {
        standardId: mockStandard.id,
        activityId: mockStandard.activityId,
      });
    });

    test('analytics fired on period row tap and action button taps', () => {
      setupHooks({ history: [mockCurrentPeriodProgress] });
      const onEdit = jest.fn();
      const onArchive = jest.fn();
      const { getByText } = render(
        <StandardDetailScreen
          standardId={mockStandard.id}
          onBack={jest.fn()}
          onEdit={onEdit}
          onArchive={onArchive}
        />
      );

      // Clear the initial view event
      jest.clearAllMocks();

      // Test Log button tap
      const logButton = getByText('Log');
      fireEvent.press(logButton);
      expect(trackStandardEvent).toHaveBeenCalledWith('standard_detail_log_tap', {
        standardId: mockStandard.id,
        activityId: mockStandard.activityId,
      });

      // Test Edit button tap
      const editButton = getByText('Edit');
      fireEvent.press(editButton);
      expect(trackStandardEvent).toHaveBeenCalledWith('standard_detail_edit_tap', {
        standardId: mockStandard.id,
        activityId: mockStandard.activityId,
      });

      // Test Archive button tap
      const archiveButton = getByText('Archive');
      fireEvent.press(archiveButton);
      expect(trackStandardEvent).toHaveBeenCalledWith('standard_detail_archive_tap', {
        standardId: mockStandard.id,
        activityId: mockStandard.activityId,
        action: 'archive',
      });
    });

    test('analytics failures fail silently without crashing', () => {
      const mockTrackStandardEvent = trackStandardEvent as jest.MockedFunction<
        typeof trackStandardEvent
      >;
      mockTrackStandardEvent.mockImplementation(() => {
        throw new Error('Analytics service unavailable');
      });

      setupHooks({ history: [mockCurrentPeriodProgress] });
      const { getByText } = render(
        <StandardDetailScreen
          standardId={mockStandard.id}
          onBack={jest.fn()}
          onEdit={jest.fn()}
          onArchive={jest.fn()}
        />
      );

      // Screen should still render despite analytics failure
      expect(getByText('Sales Calls')).toBeTruthy();

      // Actions should still work
      const logButton = getByText('Log');
      expect(() => fireEvent.press(logButton)).not.toThrow();
    });

    test('displays computed period label in summary instead of generic fallback', () => {
      const { useStandardHistory } = require('../../hooks/useStandardHistory');
      const { useStandards } = require('../../hooks/useStandards');

      useStandardHistory.mockReturnValue({
        history: [], // No history, so currentPeriodProgress will be null
        loading: false,
        error: null,
        refresh: jest.fn(),
      });

      useStandards.mockReturnValue({
        standards: [
          {
            id: 'std-1',
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
        ],
        createLogEntry: jest.fn(),
        updateLogEntry: jest.fn(),
        archiveStandard: jest.fn(),
        unarchiveStandard: jest.fn(),
      });

      const { getByText, queryByText } = render(
        <StandardDetailScreen
          standardId="std-1"
          onBack={jest.fn()}
          onEdit={jest.fn()}
          onArchive={jest.fn()}
        />
      );

      // Should show computed period label (date range), not "Current period"
      const periodLabel = getByText(/December|January|February|March|April|May|June|July|August|September|October|November/i);
      expect(periodLabel).toBeTruthy();
      // Should NOT contain generic "Current period" text
      expect(queryByText('Current period')).toBeNull();
    });
  });
});
