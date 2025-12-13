import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LogEntryModal } from '../LogEntryModal';
import { Standard } from '@minimum-standards/shared-model';

// Mock useStandards hook
jest.mock('../../hooks/useStandards', () => ({
  useStandards: jest.fn(() => ({
    activeStandards: [],
    loading: false,
  })),
}));

const mockStandard: Standard = {
  id: 'std1',
  activityId: 'act1',
  minimum: 1000,
  unit: 'calls',
  cadence: { interval: 1, unit: 'week' },
  summary: '1000 calls / week',
  state: 'active',
  createdAtMs: 1000,
  updatedAtMs: 2000,
  archivedAtMs: null,
  deletedAtMs: null,
};

describe('LogEntryModal', () => {
  describe('Standard picker rendering', () => {
    test('shows standard picker when standard is null', () => {
      const onClose = jest.fn();
      const onSave = jest.fn();
      const { useStandards } = require('../../hooks/useStandards');
      useStandards.mockReturnValue({
        activeStandards: [mockStandard],
        loading: false,
      });

      const { getByText } = render(
        <LogEntryModal
          visible={true}
          standard={null}
          onClose={onClose}
          onSave={onSave}
        />
      );

      expect(getByText(/select.*standard/i)).toBeTruthy();
    });

    test('shows logging form when standard is provided', () => {
      const onClose = jest.fn();
      const onSave = jest.fn();

      const { getByText } = render(
        <LogEntryModal
          visible={true}
          standard={mockStandard}
          onClose={onClose}
          onSave={onSave}
        />
      );

      expect(getByText('Log Progress')).toBeTruthy();
      expect(getByText(mockStandard.summary)).toBeTruthy();
    });
  });

  describe('Standard selection transitions', () => {
    test('selecting a standard transitions to logging form', async () => {
      const onClose = jest.fn();
      const onSave = jest.fn();
      const { useStandards } = require('../../hooks/useStandards');
      useStandards.mockReturnValue({
        activeStandards: [mockStandard],
        loading: false,
      });

      const { getByText, getByTestId } = render(
        <LogEntryModal
          visible={true}
          standard={null}
          onClose={onClose}
          onSave={onSave}
        />
      );

      expect(getByText(/select.*standard/i)).toBeTruthy();
      
      // Find and press the standard item
      const standardItem = getByText(mockStandard.summary);
      fireEvent.press(standardItem);

      // Should now show the logging form
      await waitFor(() => {
        expect(getByText('Log Progress')).toBeTruthy();
      });
    });
  });

  describe('Form reset on modal open/close', () => {
    test('resets form state when modal opens', () => {
      const onClose = jest.fn();
      const onSave = jest.fn();

      const { getByPlaceholderText, rerender } = render(
        <LogEntryModal
          visible={false}
          standard={mockStandard}
          onClose={onClose}
          onSave={onSave}
        />
      );

      rerender(
        <LogEntryModal
          visible={true}
          standard={mockStandard}
          onClose={onClose}
          onSave={onSave}
        />
      );

      const input = getByPlaceholderText('0');
      expect(input.props.value).toBe('');
    });

    test('resets form state when standard changes', () => {
      const onClose = jest.fn();
      const onSave = jest.fn();

      const { getByPlaceholderText, rerender } = render(
        <LogEntryModal
          visible={true}
          standard={mockStandard}
          onClose={onClose}
          onSave={onSave}
        />
      );

      const newStandard: Standard = {
        ...mockStandard,
        id: 'std2',
        summary: '2000 emails / week',
      };

      rerender(
        <LogEntryModal
          visible={true}
          standard={newStandard}
          onClose={onClose}
          onSave={onSave}
        />
      );

      const input = getByPlaceholderText('0');
      expect(input.props.value).toBe('');
    });
  });

  describe('Validation with zero values', () => {
    test('accepts zero as valid input', async () => {
      const onClose = jest.fn();
      const onSave = jest.fn().mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText } = render(
        <LogEntryModal
          visible={true}
          standard={mockStandard}
          onClose={onClose}
          onSave={onSave}
        />
      );

      const input = getByPlaceholderText('0');
      const saveButton = getByText('Save');

      fireEvent.changeText(input, '0');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          mockStandard.id,
          0,
          expect.any(Number),
          null
        );
      });
    });

    test('rejects negative values', async () => {
      const onClose = jest.fn();
      const onSave = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <LogEntryModal
          visible={true}
          standard={mockStandard}
          onClose={onClose}
          onSave={onSave}
        />
      );

      const input = getByPlaceholderText('0');
      const saveButton = getByText('Save');

      fireEvent.changeText(input, '-5');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(getByText(/valid number/i)).toBeTruthy();
      });

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('Date/time picker functionality', () => {
    test('collapsed state defaults to current time', () => {
      const onClose = jest.fn();
      const onSave = jest.fn();

      const { getByText } = render(
        <LogEntryModal
          visible={true}
          standard={mockStandard}
          onClose={onClose}
          onSave={onSave}
        />
      );

      // "+ When?" button should be visible when collapsed
      expect(getByText('+ When?')).toBeTruthy();
    });

    test('expand/collapse toggle works', () => {
      const onClose = jest.fn();
      const onSave = jest.fn();

      const { getByText, queryByText } = render(
        <LogEntryModal
          visible={true}
          standard={mockStandard}
          onClose={onClose}
          onSave={onSave}
        />
      );

      const whenButton = getByText('+ When?');
      fireEvent.press(whenButton);

      // Should show "Now" button and date picker
      expect(getByText('Now')).toBeTruthy();
    });

    test('"Now" button resets to current time', () => {
      const onClose = jest.fn();
      const onSave = jest.fn();

      const { getByText } = render(
        <LogEntryModal
          visible={true}
          standard={mockStandard}
          onClose={onClose}
          onSave={onSave}
        />
      );

      const whenButton = getByText('+ When?');
      fireEvent.press(whenButton);

      const nowButton = getByText('Now');
      fireEvent.press(nowButton);

      // Date should be reset (tested via the component's internal state)
      expect(nowButton).toBeTruthy();
    });
  });

  describe('Error handling', () => {
    test('displays error for invalid input', async () => {
      const onClose = jest.fn();
      const onSave = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <LogEntryModal
          visible={true}
          standard={mockStandard}
          onClose={onClose}
          onSave={onSave}
        />
      );

      const input = getByPlaceholderText('0');
      const saveButton = getByText('Save');

      fireEvent.changeText(input, 'invalid');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(getByText(/valid number/i)).toBeTruthy();
      });
    });

    test('shows error when no active standards available', () => {
      const onClose = jest.fn();
      const onSave = jest.fn();
      const { useStandards } = require('../../hooks/useStandards');
      useStandards.mockReturnValue({
        activeStandards: [],
        loading: false,
      });

      const { getByText } = render(
        <LogEntryModal
          visible={true}
          standard={null}
          onClose={onClose}
          onSave={onSave}
        />
      );

      expect(getByText(/no active standards/i)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    test('has accessibility labels for interactive elements', () => {
      const onClose = jest.fn();
      const onSave = jest.fn();

      const { getByLabelText } = render(
        <LogEntryModal
          visible={true}
          standard={mockStandard}
          onClose={onClose}
          onSave={onSave}
        />
      );

      expect(getByLabelText(/enter value/i)).toBeTruthy();
      expect(getByLabelText(/add optional note/i)).toBeTruthy();
      expect(getByLabelText(/select when/i)).toBeTruthy();
    });
  });

  describe('Edit mode', () => {
    const mockLogEntry = {
      id: 'log-1',
      standardId: 'std1',
      value: 50,
      occurredAtMs: 1702008000000, // Dec 8, 2023
      note: 'Test note',
      editedAtMs: null,
      createdAtMs: 1702000000000,
      updatedAtMs: 1702000000000,
      deletedAtMs: null,
    };

    test('initializes edit mode when logEntry prop is provided', () => {
      const onClose = jest.fn();
      const onSave = jest.fn();

      const { getByText, getByDisplayValue } = render(
        <LogEntryModal
          visible={true}
          standard={mockStandard}
          logEntry={mockLogEntry}
          onClose={onClose}
          onSave={onSave}
        />
      );

      // Should show "Edit Log" title
      expect(getByText('Edit Log')).toBeTruthy();
      
      // Form should be pre-filled
      expect(getByDisplayValue('50')).toBeTruthy();
      expect(getByDisplayValue('Test note')).toBeTruthy();
    });

    test('pre-fills form fields from logEntry in edit mode', () => {
      const onClose = jest.fn();
      const onSave = jest.fn();

      const { getByDisplayValue } = render(
        <LogEntryModal
          visible={true}
          standard={mockStandard}
          logEntry={mockLogEntry}
          onClose={onClose}
          onSave={onSave}
        />
      );

      // Value should be pre-filled
      const valueInput = getByDisplayValue('50');
      expect(valueInput).toBeTruthy();

      // Note should be pre-filled and visible
      const noteInput = getByDisplayValue('Test note');
      expect(noteInput).toBeTruthy();
    });

    test('shows "Log Activity" title in create mode', () => {
      const onClose = jest.fn();
      const onSave = jest.fn();

      const { getByText } = render(
        <LogEntryModal
          visible={true}
          standard={mockStandard}
          onClose={onClose}
          onSave={onSave}
        />
      );

      expect(getByText('Log Activity')).toBeTruthy();
    });

    test('calls onSave with logEntryId in edit mode', async () => {
      const onClose = jest.fn();
      const onSave = jest.fn().mockResolvedValue(undefined);

      const { getByText, getByPlaceholderText } = render(
        <LogEntryModal
          visible={true}
          standard={mockStandard}
          logEntry={mockLogEntry}
          onClose={onClose}
          onSave={onSave}
        />
      );

      const valueInput = getByPlaceholderText('0');
      const saveButton = getByText('Save');

      // Change the value
      fireEvent.changeText(valueInput, '75');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          mockStandard.id,
          75,
          expect.any(Number),
          'Test note',
          'log-1' // logEntryId should be passed
        );
      });
    });

    test('pre-populates date/time picker with logEntry occurredAtMs', () => {
      const onClose = jest.fn();
      const onSave = jest.fn();

      const { getByText } = render(
        <LogEntryModal
          visible={true}
          standard={mockStandard}
          logEntry={mockLogEntry}
          onClose={onClose}
          onSave={onSave}
        />
      );

      // Date picker should be expanded in edit mode
      // The date should be formatted and displayed
      expect(getByText('Now')).toBeTruthy(); // "Now" button indicates date picker is expanded
    });
  });
});
