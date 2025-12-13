import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from '../App';

// Mock SafeAreaProvider
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children }: any) => children,
  };
});

// Mock the hooks and components
const mockCreateLogEntry = jest.fn().mockResolvedValue(undefined);

jest.mock('../src/hooks/useStandards', () => ({
  useStandards: jest.fn(() => ({
    activeStandards: [
      {
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
      },
    ],
    loading: false,
    createLogEntry: mockCreateLogEntry,
  })),
}));

jest.mock('../src/components/LogEntryModal', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity, Modal } = require('react-native');
  return {
    LogEntryModal: ({ visible, standard, onClose, onSave }: any) => {
      if (!visible) return null;
      return (
        <Modal visible={visible} testID="log-entry-modal">
          <View>
            <Text testID="modal-title">
              {standard === null ? 'Select Standard' : 'Log Progress'}
            </Text>
            <TouchableOpacity onPress={onClose} testID="close-button">
              <Text>Close</Text>
            </TouchableOpacity>
            {standard === null && (
              <TouchableOpacity
                onPress={() => {
                  const mockStandard = {
                    id: 'std1',
                    summary: '1000 calls / week',
                  };
                  onSave(mockStandard.id, 100, Date.now(), null);
                  onClose();
                }}
                testID="select-standard"
              >
                <Text>Select Standard</Text>
              </TouchableOpacity>
            )}
          </View>
        </Modal>
      );
    },
  };
});

describe('App - HomeScreen Global Logging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Log Activity button opens LogEntryModal with standard=null', async () => {
    const { getByText, getByTestId } = render(<App />);

    const logButton = getByText('Log Activity');
    expect(logButton).toBeTruthy();
    
    fireEvent.press(logButton);

    await waitFor(() => {
      expect(getByTestId('log-entry-modal')).toBeTruthy();
    });

    expect(getByTestId('modal-title').props.children).toBe('Select Standard');
  });

  test('successful log closes modal and returns to HomeScreen', async () => {
    const { getByText, getByTestId, queryByTestId } = render(<App />);

    const logButton = getByText('Log Activity');
    fireEvent.press(logButton);

    await waitFor(() => {
      expect(getByTestId('log-entry-modal')).toBeTruthy();
    });

    const selectButton = getByTestId('select-standard');
    fireEvent.press(selectButton);

    await waitFor(() => {
      expect(queryByTestId('log-entry-modal')).toBeNull();
    });

    expect(mockCreateLogEntry).toHaveBeenCalledWith({
      standardId: 'std1',
      value: 100,
      occurredAtMs: expect.any(Number),
      note: null,
    });
  });
});
