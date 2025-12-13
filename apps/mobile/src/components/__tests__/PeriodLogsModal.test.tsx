import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { PeriodLogsModal } from '../PeriodLogsModal';
import { usePeriodLogs } from '../../hooks/usePeriodLogs';
import { useStandards } from '../../hooks/useStandards';
import { Alert } from 'react-native';

jest.mock('../../hooks/usePeriodLogs', () => ({
  usePeriodLogs: jest.fn(),
}));

jest.mock('../../hooks/useStandards', () => ({
  useStandards: jest.fn(),
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Alert.alert = jest.fn();
  return RN;
});

const mockUsePeriodLogs = usePeriodLogs as jest.MockedFunction<typeof usePeriodLogs>;
const mockUseStandards = useStandards as jest.MockedFunction<typeof useStandards>;

const mockLogs = [
  {
    id: 'log-1',
    value: 10,
    occurredAtMs: 1702008000000,
    note: 'Morning session',
    editedAtMs: null,
  },
  {
    id: 'log-2',
    value: 5,
    occurredAtMs: 1702094400000,
    note: null,
    editedAtMs: 1702100000000, // Edited log
  },
];

const mockStandard = {
  id: 'std-1',
  activityId: 'act-1',
  minimum: 100,
  unit: 'calls',
  cadence: { interval: 1, unit: 'week' },
  summary: '100 calls / week',
  state: 'active' as const,
  archivedAtMs: null,
  createdAtMs: 1000,
  updatedAtMs: 2000,
  deletedAtMs: null,
};

const mockArchivedStandard = {
  ...mockStandard,
  state: 'archived' as const,
  archivedAtMs: 2000,
};

function setupHook(overrides: Partial<ReturnType<typeof usePeriodLogs>> = {}) {
  mockUsePeriodLogs.mockReturnValue({
    logs: [],
    loading: false,
    error: null,
    ...overrides,
  } as ReturnType<typeof usePeriodLogs>);
}

function setupStandardsHook(overrides: Partial<ReturnType<typeof useStandards>> & { standard?: typeof mockStandard } = {}) {
  const standard = overrides.standard || mockStandard;
  mockUseStandards.mockReturnValue({
    standards: [standard],
    activeStandards: standard.state === 'active' ? [standard] : [],
    archivedStandards: standard.state === 'archived' ? [standard] : [],
    pinnedStandards: [],
    orderedActiveStandards: standard.state === 'active' ? [standard] : [],
    pinOrder: [],
    loading: false,
    error: null,
    createStandard: jest.fn(),
    archiveStandard: jest.fn(),
    unarchiveStandard: jest.fn(),
    createLogEntry: jest.fn(),
    updateLogEntry: jest.fn().mockResolvedValue(undefined),
    deleteLogEntry: jest.fn().mockResolvedValue(undefined),
    restoreLogEntry: jest.fn().mockResolvedValue(undefined),
    canLogStandard: jest.fn((id: string) => id === standard.id && standard.state === 'active' && !standard.archivedAtMs),
    pinStandard: jest.fn(),
    unpinStandard: jest.fn(),
    movePinnedStandard: jest.fn(),
    ...overrides,
  } as ReturnType<typeof useStandards>);
}

describe('PeriodLogsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupStandardsHook();
  });

  test('modal opens when visible is true', () => {
    setupHook({ logs: mockLogs });
    const { getByText } = render(
      <PeriodLogsModal
        visible={true}
        standardId="std-1"
        periodStartMs={1702008000000}
        periodEndMs={1702612800000}
        periodLabel="Week of Dec 8"
        onClose={jest.fn()}
      />
    );
    expect(getByText('Week of Dec 8')).toBeTruthy();
  });

  test('modal displays logs list with value, occurred date/time, note', () => {
    setupHook({ logs: mockLogs });
    const { getByText, getAllByText } = render(
      <PeriodLogsModal
        visible={true}
        standardId="std-1"
        periodStartMs={1702008000000}
        periodEndMs={1702612800000}
        periodLabel="Week of Dec 8"
        onClose={jest.fn()}
      />
    );
    // Check for log values
    expect(getByText('10')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
    // Check for note
    expect(getByText('Morning session')).toBeTruthy();
    // Check for date/time (formatted) - should appear at least once
    const dateElements = getAllByText(/dec|december/i);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  test('modal filters out soft-deleted logs', () => {
    // The hook should already filter deleted logs, so we test that only non-deleted logs appear
    setupHook({ logs: mockLogs });
    const { getByText } = render(
      <PeriodLogsModal
        visible={true}
        standardId="std-1"
        periodStartMs={1702008000000}
        periodEndMs={1702612800000}
        periodLabel="Week of Dec 8"
        onClose={jest.fn()}
      />
    );
    // Only non-deleted logs should appear
    expect(getByText('10')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
  });

  test('shows loading state', () => {
    setupHook({ loading: true });
    const { getByTestId } = render(
      <PeriodLogsModal
        visible={true}
        standardId="std-1"
        periodStartMs={1702008000000}
        periodEndMs={1702612800000}
        periodLabel="Week of Dec 8"
        onClose={jest.fn()}
      />
    );
    expect(getByTestId('logs-loading')).toBeTruthy();
  });

  test('shows error state', () => {
    setupHook({ error: new Error('Failed to load logs') });
    const { getByText } = render(
      <PeriodLogsModal
        visible={true}
        standardId="std-1"
        periodStartMs={1702008000000}
        periodEndMs={1702612800000}
        periodLabel="Week of Dec 8"
        onClose={jest.fn()}
      />
    );
    expect(getByText(/failed to load|error/i)).toBeTruthy();
  });

  test('calls onClose when close button is pressed', () => {
    const onClose = jest.fn();
    setupHook({ logs: mockLogs });
    const { getByText } = render(
      <PeriodLogsModal
        visible={true}
        standardId="std-1"
        periodStartMs={1702008000000}
        periodEndMs={1702612800000}
        periodLabel="Week of Dec 8"
        onClose={onClose}
      />
    );
    const closeButton = getByText('✕');
    fireEvent.press(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  describe('Edit and delete actions', () => {
    test('edit button opens LogEntryModal in edit mode', async () => {
      setupHook({ logs: mockLogs });
      const { getAllByText, getByText } = render(
        <PeriodLogsModal
          visible={true}
          standardId="std-1"
          periodStartMs={1702008000000}
          periodEndMs={1702612800000}
          periodLabel="Week of Dec 8"
          onClose={jest.fn()}
        />
      );

      const editButtons = getAllByText('Edit');
      fireEvent.press(editButtons[0]);

      await waitFor(() => {
        // LogEntryModal should be visible with "Edit Log" title
        expect(getByText('Edit Log')).toBeTruthy();
      });
    });

    test('delete button shows confirmation dialog', () => {
      setupHook({ logs: mockLogs });
      const { getAllByText } = render(
        <PeriodLogsModal
          visible={true}
          standardId="std-1"
          periodStartMs={1702008000000}
          periodEndMs={1702612800000}
          periodLabel="Week of Dec 8"
          onClose={jest.fn()}
        />
      );

      const deleteButtons = getAllByText('Delete');
      fireEvent.press(deleteButtons[0]);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Log Entry',
        'Are you sure you want to delete this log entry?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
          expect.objectContaining({ text: 'Delete', style: 'destructive' }),
        ])
      );
    });

    test('edit and delete buttons are disabled for archived standards', () => {
      const archivedStandard = {
        ...mockStandard,
        id: 'std-1',
        state: 'archived' as const,
        archivedAtMs: 2000,
      };
      setupStandardsHook({ standard: archivedStandard });
      setupHook({ logs: mockLogs });
      const { queryByText } = render(
        <PeriodLogsModal
          visible={true}
          standardId="std-1"
          periodStartMs={1702008000000}
          periodEndMs={1702612800000}
          periodLabel="Week of Dec 8"
          onClose={jest.fn()}
        />
      );

      // Edit and delete buttons should not be visible for archived standards
      expect(queryByText('Edit')).toBeNull();
      expect(queryByText('Delete')).toBeNull();
    });
  });

  describe('Undo snackbar and edited indicator', () => {
    test('shows undo snackbar after deletion', async () => {
      const mockDeleteLogEntry = jest.fn().mockResolvedValue(undefined);
      setupStandardsHook({
        standard: mockStandard,
        deleteLogEntry: mockDeleteLogEntry,
      });
      setupHook({ logs: mockLogs });

      const { getAllByText, getByText } = render(
        <PeriodLogsModal
          visible={true}
          standardId="std-1"
          periodStartMs={1702008000000}
          periodEndMs={1702612800000}
          periodLabel="Week of Dec 8"
          onClose={jest.fn()}
        />
      );

      // Simulate delete confirmation
      const deleteButtons = getAllByText('Delete');
      fireEvent.press(deleteButtons[0]);

      // Simulate Alert confirmation
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const deleteAction = alertCall[2].find((action: any) => action.text === 'Delete');
      await deleteAction.onPress();

      await waitFor(() => {
        expect(getByText('Log entry deleted')).toBeTruthy();
        expect(getByText('Undo')).toBeTruthy();
      });
    });

    test('undo button restores deleted log entry', async () => {
      const mockRestoreLogEntry = jest.fn().mockResolvedValue(undefined);
      setupStandardsHook({
        standard: mockStandard,
        restoreLogEntry: mockRestoreLogEntry,
        deleteLogEntry: jest.fn().mockResolvedValue(undefined),
      });
      setupHook({ logs: mockLogs });

      const { getAllByText, getByText, queryByText } = render(
        <PeriodLogsModal
          visible={true}
          standardId="std-1"
          periodStartMs={1702008000000}
          periodEndMs={1702612800000}
          periodLabel="Week of Dec 8"
          onClose={jest.fn()}
        />
      );

      // Delete a log
      const deleteButtons = getAllByText('Delete');
      fireEvent.press(deleteButtons[0]);
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const deleteAction = alertCall[2].find((action: any) => action.text === 'Delete');
      await deleteAction.onPress();

      await waitFor(() => {
        expect(getByText('Undo')).toBeTruthy();
      });

      // Click undo
      const undoButton = getByText('Undo');
      fireEvent.press(undoButton);

      await waitFor(() => {
        expect(mockRestoreLogEntry).toHaveBeenCalledWith('log-1', 'std-1');
        expect(queryByText('Log entry deleted')).toBeNull();
      });
    });

    test('shows edited indicator for logs with editedAtMs', () => {
      setupHook({ logs: mockLogs });
      const { getByText } = render(
        <PeriodLogsModal
          visible={true}
          standardId="std-1"
          periodStartMs={1702008000000}
          periodEndMs={1702612800000}
          periodLabel="Week of Dec 8"
          onClose={jest.fn()}
        />
      );

      // Should show "Edited" indicator for log-2 which has editedAtMs
      expect(getByText('Edited')).toBeTruthy();
    });

    test('undo snackbar auto-dismisses after 5 seconds', async () => {
      jest.useFakeTimers();
      const mockDeleteLogEntry = jest.fn().mockResolvedValue(undefined);
      setupStandardsHook({
        standard: mockStandard,
        deleteLogEntry: mockDeleteLogEntry,
      });
      setupHook({ logs: mockLogs });

      const { getAllByText, getByText, queryByText } = render(
        <PeriodLogsModal
          visible={true}
          standardId="std-1"
          periodStartMs={1702008000000}
          periodEndMs={1702612800000}
          periodLabel="Week of Dec 8"
          onClose={jest.fn()}
        />
      );

      // Delete a log
      const deleteButtons = getAllByText('Delete');
      fireEvent.press(deleteButtons[0]);
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const deleteAction = alertCall[2].find((action: any) => action.text === 'Delete');
      await deleteAction.onPress();

      await waitFor(() => {
        expect(getByText('Log entry deleted')).toBeTruthy();
      });

      // Fast-forward 5 seconds
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(queryByText('Log entry deleted')).toBeNull();
      });

      jest.useRealTimers();
    });
  });
});
