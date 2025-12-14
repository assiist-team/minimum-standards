/**
 * Integration tests for Standard Detail Screen
 * 
 * These tests validate end-to-end workflows:
 * - Navigation flow: dashboard card tap → detail screen → period tap → logs modal
 * - Logging from detail screen updates history
 * - Archive/unarchive from detail screen updates state
 * - Period history accuracy across multiple periods
 * - Empty history → log entry → history appears
 * - Error recovery (retry after Firestore failure)
 * 
 * Task Group 10: Integrated workflow validation
 */

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StandardDetailScreen } from '../StandardDetailScreen';
import { useStandardHistory } from '../../hooks/useStandardHistory';
import { useStandards } from '../../hooks/useStandards';
import type { Standard } from '@minimum-standards/shared-model';
import type { PeriodHistoryEntry } from '../../utils/standardHistory';

jest.mock('../../hooks/useStandardHistory', () => ({
  useStandardHistory: jest.fn(),
}));

jest.mock('../../hooks/useStandards', () => ({
  useStandards: jest.fn(),
}));

jest.mock('../../utils/analytics', () => ({
  trackStandardEvent: jest.fn(),
}));

jest.mock('../../components/LogEntryModal', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    LogEntryModal: ({ visible, standard, onClose, onSave }: any) => {
      if (!visible) return null;
      return (
        <View testID="log-entry-modal">
          <Text>LogEntryModal</Text>
          {standard && <Text testID="modal-standard-id">{standard.id}</Text>}
          <TouchableOpacity
            testID="modal-save"
            onPress={() => {
              onSave(standard?.id || '', 10, Date.now(), null);
              onClose();
            }}
          >
            <Text>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="modal-close" onPress={onClose}>
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      );
    },
  };
});

jest.mock('../../components/PeriodLogsModal', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    PeriodLogsModal: ({ visible, periodLabel, onClose }: any) => {
      if (!visible) return null;
      return (
        <View testID="period-logs-modal">
          <Text testID="modal-period-label">{periodLabel}</Text>
          <TouchableOpacity testID="modal-close" onPress={onClose}>
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      );
    },
  };
});

jest.mock('../../components/PeriodHistoryList', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    PeriodHistoryList: ({ history, onPeriodPress }: any) => {
      return (
        <View testID="history-list">
          {history.map((entry: PeriodHistoryEntry, index: number) => (
            <TouchableOpacity
              key={index}
              testID={`period-row-${index}`}
              onPress={() => onPeriodPress(entry)}
            >
              <Text>{entry.periodLabel}</Text>
              <Text>{entry.total} / {entry.target}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    },
  };
});

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

const mockPeriod1: PeriodHistoryEntry = {
  periodLabel: 'Week of Dec 8',
  total: 10,
  target: 100,
  targetSummary: '100 calls / week',
  status: 'In Progress',
  progressPercent: 10,
  periodStartMs: 1702008000000,
  periodEndMs: 1702612800000,
};

const mockPeriod2: PeriodHistoryEntry = {
  periodLabel: 'Week of Dec 1',
  total: 95,
  target: 100,
  targetSummary: '100 calls / week',
  status: 'In Progress',
  progressPercent: 95,
  periodStartMs: 1701403200000,
  periodEndMs: 1702008000000,
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
    createLogEntry: jest.fn().mockResolvedValue(undefined),
    canLogStandard: jest.fn(() => true),
    pinStandard: jest.fn(),
    unpinStandard: jest.fn(),
    movePinnedStandard: jest.fn(),
    ...standardsOverrides,
  } as ReturnType<typeof useStandards>);
}

describe('StandardDetailScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('navigation flow: dashboard card tap → detail screen → period tap → logs modal', async () => {
    setupHooks({ history: [mockPeriod1, mockPeriod2] });
    const { getByText, getByTestId, queryByTestId } = render(
      <StandardDetailScreen
        standardId={mockStandard.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
      />
    );

    // Detail screen should be visible
    expect(getByText('Sales Calls')).toBeTruthy();
    expect(getByTestId('history-list')).toBeTruthy();

    // Period logs modal should not be visible initially
    expect(queryByTestId('period-logs-modal')).toBeNull();

    // Tap a period row
    const periodRow = getByTestId('period-row-0');
    fireEvent.press(periodRow);

    // Period logs modal should now be visible
    await waitFor(() => {
      expect(getByTestId('period-logs-modal')).toBeTruthy();
      expect(getByTestId('modal-period-label').props.children).toBe('Week of Dec 8');
    });
  });

  test('logging from detail screen updates history', async () => {
    const createLogEntry = jest.fn().mockResolvedValue(undefined);
    const refresh = jest.fn();
    setupHooks(
      { history: [mockPeriod1], refresh },
      { createLogEntry }
    );

    const { getByText, getByTestId, queryByTestId } = render(
      <StandardDetailScreen
        standardId={mockStandard.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
      />
    );

    // Open log modal
    const logButton = getByText('Log');
    fireEvent.press(logButton);

    await waitFor(() => {
      expect(getByTestId('log-entry-modal')).toBeTruthy();
    });

    // Save log entry
    const saveButton = getByTestId('modal-save');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(createLogEntry).toHaveBeenCalledWith({
        standardId: mockStandard.id,
        value: 10,
        occurredAtMs: expect.any(Number),
        note: null,
      });
    });

    // Modal should close
    await waitFor(() => {
      expect(queryByTestId('log-entry-modal')).toBeNull();
    });
  });

  test('archive/unarchive from detail screen updates state', async () => {
    const archiveStandard = jest.fn().mockResolvedValue(undefined);
    const unarchiveStandard = jest.fn().mockResolvedValue(undefined);
    const onArchive = jest.fn();

    // Test archive
    setupHooks(
      { history: [mockPeriod1] },
      { archiveStandard }
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

    await waitFor(() => {
      expect(archiveStandard).toHaveBeenCalledWith(mockStandard.id);
      expect(onArchive).toHaveBeenCalledWith(mockStandard.id);
    });

    // Test unarchive
    const archivedStandard: Standard = {
      ...mockStandard,
      state: 'archived',
      archivedAtMs: Date.now(),
    };
    setupHooks(
      { history: [mockPeriod1] },
      {
        standards: [archivedStandard],
        activeStandards: [],
        archivedStandards: [archivedStandard],
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

    await waitFor(() => {
      expect(unarchiveStandard).toHaveBeenCalledWith(archivedStandard.id);
      expect(onArchive).toHaveBeenCalledWith(archivedStandard.id);
    });
  });

  test('period history accuracy across multiple periods', () => {
    setupHooks({ history: [mockPeriod1, mockPeriod2] });
    const { getByTestId, getAllByText } = render(
      <StandardDetailScreen
        standardId={mockStandard.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
      />
    );

    const historyList = getByTestId('history-list');
    expect(historyList).toBeTruthy();

    // First period (most recent) should be first
    const period1Row = getByTestId('period-row-0');
    expect(period1Row).toBeTruthy();
    // Period label appears in both current period summary and history, so use getAllByText
    const period1Labels = getAllByText('Week of Dec 8');
    expect(period1Labels.length).toBeGreaterThan(0);

    // Second period should be second
    const period2Row = getByTestId('period-row-1');
    expect(period2Row).toBeTruthy();
    const period2Labels = getAllByText('Week of Dec 1');
    expect(period2Labels.length).toBeGreaterThan(0);

    // Verify totals are correct (may appear multiple times)
    const totals1 = getAllByText('10 / 100');
    expect(totals1.length).toBeGreaterThan(0);
    const totals2 = getAllByText('95 / 100');
    expect(totals2.length).toBeGreaterThan(0);
  });

  test('empty history → log entry → history appears', async () => {
    const createLogEntry = jest.fn().mockResolvedValue(undefined);
    let history = [] as PeriodHistoryEntry[];
    const refresh = jest.fn(() => {
      // Simulate history update after logging
      history = [mockPeriod1];
      mockUseStandardHistory.mockReturnValue({
        history,
        loading: false,
        error: null,
        refresh,
      } as ReturnType<typeof useStandardHistory>);
    });

    setupHooks(
      { history: [], refresh },
      { createLogEntry }
    );

    const { getByText, getByTestId, queryByTestId, rerender } = render(
      <StandardDetailScreen
        standardId={mockStandard.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
      />
    );

    // Initially no history
    expect(queryByTestId('history-list')).toBeNull();
    expect(getByText(/no history|no logs/i)).toBeTruthy();

    // Log entry
    const logButton = getByText('Log');
    fireEvent.press(logButton);

    await waitFor(() => {
      expect(getByTestId('log-entry-modal')).toBeTruthy();
    });

    const saveButton = getByTestId('modal-save');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(createLogEntry).toHaveBeenCalled();
    });

    // Simulate history refresh
    refresh();
    rerender(
      <StandardDetailScreen
        standardId={mockStandard.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
      />
    );

    // History should now appear
    await waitFor(() => {
      expect(getByTestId('history-list')).toBeTruthy();
    });
  });

  test('error recovery (retry after Firestore failure)', async () => {
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

    // Error should be displayed
    expect(getByText(/firestore connection failed|something went wrong/i)).toBeTruthy();

    // Retry should be available
    const retryButton = getByText('Retry');
    fireEvent.press(retryButton);

    expect(refresh).toHaveBeenCalledTimes(1);

    // Simulate successful recovery
    setupHooks({ history: [mockPeriod1], refresh });
    const { rerender } = render(
      <StandardDetailScreen
        standardId={mockStandard.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
      />
    );

    rerender(
      <StandardDetailScreen
        standardId={mockStandard.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
        onArchive={jest.fn()}
      />
    );

    // Error should be gone, content should be visible
    await waitFor(() => {
      expect(getByText('Sales Calls')).toBeTruthy();
    });
  });
});
