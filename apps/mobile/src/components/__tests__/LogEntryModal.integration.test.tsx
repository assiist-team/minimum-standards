import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LogEntryModal } from '../LogEntryModal';
import { Standard } from '@minimum-standards/shared-model';

// Mock useStandards hook
const mockCreateLogEntry = jest.fn().mockResolvedValue(undefined);
const mockActiveStandards: Standard[] = [
  {
    id: 'std1',
    activityId: 'act1',
    minimum: 1000,
    unit: 'calls',
    cadence: { interval: 1, unit: 'week' },
    summary: '1000 calls / week',
    sessionConfig: { sessionLabel: 'session', sessionsPerCadence: 1, volumePerSession: 1000 },
    state: 'active',
    createdAtMs: 1000,
    updatedAtMs: 2000,
    archivedAtMs: null,
    deletedAtMs: null,
  },
  {
    id: 'std2',
    activityId: 'act2',
    minimum: 50,
    unit: 'emails',
    cadence: { interval: 1, unit: 'day' },
    summary: '50 emails / day',
    sessionConfig: { sessionLabel: 'session', sessionsPerCadence: 1, volumePerSession: 50 },
    state: 'active',
    createdAtMs: 2000,
    updatedAtMs: 3000,
    archivedAtMs: null,
    deletedAtMs: null,
  },
];

const resolveActivityName = (activityId: string) => {
  if (activityId === 'act1') return 'Cold Calls';
  if (activityId === 'act2') return 'Emails';
  return undefined;
};

jest.mock('../../hooks/useStandards', () => ({
  useStandards: jest.fn(() => ({
    activeStandards: mockActiveStandards,
    loading: false,
    createLogEntry: mockCreateLogEntry,
  })),
}));

describe('LogEntryModal Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-end logging workflows', () => {
    test('logging from dashboard with pre-selected standard', async () => {
      const onClose = jest.fn();
      const onSave = jest.fn().mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText } = render(
        <LogEntryModal
          visible={true}
          standard={mockActiveStandards[0]}
          onClose={onClose}
          onSave={onSave}
          resolveActivityName={resolveActivityName}
        />
      );

      const input = getByPlaceholderText('0');
      const saveButton = getByText('Save');

      fireEvent.changeText(input, '150');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          'std1',
          150,
          expect.any(Number),
          null
        );
      });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    test('logging from HomeScreen with standard picker', async () => {
      const onClose = jest.fn();
      const onSave = jest.fn().mockResolvedValue(undefined);

      const { getByText } = render(
        <LogEntryModal
          visible={true}
          standard={null}
          onClose={onClose}
          onSave={onSave}
          resolveActivityName={resolveActivityName}
        />
      );

      // Should show picker first
      expect(getByText(/select.*standard/i)).toBeTruthy();

      // Select a standard
      const standardItem = getByText('1000 calls / week');
      fireEvent.press(standardItem);

      // Should now show form
      await waitFor(() => {
        expect(getByText('Log Cold Calls')).toBeTruthy();
      });

      // Enter value and save
      const input = getByPlaceholderText('0');
      fireEvent.changeText(input, '200');

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          'std1',
          200,
          expect.any(Number),
          null
        );
      });
    });

    test('backdating a log entry', async () => {
      const onClose = jest.fn();
      const onSave = jest.fn().mockResolvedValue(undefined);

      const { getByText, getByPlaceholderText } = render(
        <LogEntryModal
          visible={true}
          standard={mockActiveStandards[0]}
          onClose={onClose}
          onSave={onSave}
          resolveActivityName={resolveActivityName}
        />
      );

      // Expand "When?" section
      const whenButton = getByText('When');
      fireEvent.press(whenButton);

      // Verify date picker is shown
      await waitFor(() => {
        expect(getByText('Now')).toBeTruthy();
      });

      // Set a past date (mock the date picker change)
      // In a real test, we would simulate the date picker change
      // For now, we'll verify the "Now" button works
      const nowButton = getByText('Now');
      fireEvent.press(nowButton);

      // Enter value and save
      const input = getByPlaceholderText('0');
      fireEvent.changeText(input, '100');
      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          'std1',
          100,
          expect.any(Number),
          null
        );
      });
    });

    test('logging zero value', async () => {
      const onClose = jest.fn();
      const onSave = jest.fn().mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText } = render(
        <LogEntryModal
          visible={true}
          standard={mockActiveStandards[0]}
          onClose={onClose}
          onSave={onSave}
          resolveActivityName={resolveActivityName}
        />
      );

      const input = getByPlaceholderText('0');
      const saveButton = getByText('Save');

      fireEvent.changeText(input, '0');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          'std1',
          0,
          expect.any(Number),
          null
        );
      });

      expect(onClose).toHaveBeenCalled();
    });

    test('error recovery flow - invalid input then valid input', async () => {
      const onClose = jest.fn();
      const onSave = jest.fn().mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText, queryByText } = render(
        <LogEntryModal
          visible={true}
          standard={mockActiveStandards[0]}
          onClose={onClose}
          onSave={onSave}
        />
      );

      const input = getByPlaceholderText('0');
      const saveButton = getByText('Save');

      // Try invalid input
      fireEvent.changeText(input, '-5');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(getByText(/valid number/i)).toBeTruthy();
      });

      expect(onSave).not.toHaveBeenCalled();

      // Fix input
      fireEvent.changeText(input, '50');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          'std1',
          50,
          expect.any(Number),
          null
        );
      });

      // Error should be cleared
      await waitFor(() => {
        expect(queryByText(/valid number/i)).toBeNull();
      });
    });

    test('modal state reset on close and reopen', async () => {
      const onClose = jest.fn();
      const onSave = jest.fn().mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText, rerender } = render(
        <LogEntryModal
          visible={true}
          standard={mockActiveStandards[0]}
          onClose={onClose}
          onSave={onSave}
        />
      );

      const input = getByPlaceholderText('0');
      fireEvent.changeText(input, '100');
      expect(input.props.value).toBe('100');

      // Close modal
      const closeButton = getByText('✕');
      fireEvent.press(closeButton);

      expect(onClose).toHaveBeenCalled();

      // Close modal (set visible to false)
      rerender(
        <LogEntryModal
          visible={false}
          standard={mockActiveStandards[0]}
          onClose={onClose}
          onSave={onSave}
        />
      );

      // Reopen modal (set visible to true)
      rerender(
        <LogEntryModal
          visible={true}
          standard={mockActiveStandards[0]}
          onClose={onClose}
          onSave={onSave}
        />
      );

      // Wait for form to render and verify input is reset
      await waitFor(() => {
        const newInput = getByPlaceholderText('0');
        expect(newInput.props.value).toBe('');
      });
    });
  });
});
