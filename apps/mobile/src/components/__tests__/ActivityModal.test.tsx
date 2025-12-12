import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ActivityModal } from '../ActivityModal';
import { Activity } from '@minimum-standards/shared-model';

// Mock the activity schema to avoid import issues in tests
jest.mock('@minimum-standards/shared-model', () => ({
  ...jest.requireActual('@minimum-standards/shared-model'),
  activitySchema: {
    parse: jest.fn((data) => ({
      ...data,
      unit: data.unit.endsWith('s') ? data.unit : `${data.unit}s`,
    })),
  },
}));

describe('ActivityModal', () => {
  const mockActivity: Activity = {
    id: 'a1',
    name: 'Sales Calls',
    unit: 'calls',
    inputType: 'number',
    createdAtMs: 1000,
    updatedAtMs: 2000,
    deletedAtMs: null,
  };

  test('renders create mode correctly', () => {
    const onClose = jest.fn();
    const onSave = jest.fn().mockResolvedValue(mockActivity);

    const { getByText, getByPlaceholderText } = render(
      <ActivityModal visible={true} onClose={onClose} onSave={onSave} />
    );

    expect(getByText('Add Activity')).toBeTruthy();
    expect(getByPlaceholderText('e.g., Sales Calls')).toBeTruthy();
  });

  test('renders edit mode correctly', () => {
    const onClose = jest.fn();
    const onSave = jest.fn().mockResolvedValue(mockActivity);

    const { getByText, getByDisplayValue } = render(
      <ActivityModal
        visible={true}
        activity={mockActivity}
        onClose={onClose}
        onSave={onSave}
      />
    );

    expect(getByText('Edit Activity')).toBeTruthy();
    expect(getByDisplayValue('Sales Calls')).toBeTruthy();
    expect(getByDisplayValue('calls')).toBeTruthy();
  });

  test('validates required fields', async () => {
    const onClose = jest.fn();
    const onSave = jest.fn();

    const { getByText, getByPlaceholderText } = render(
      <ActivityModal visible={true} onClose={onClose} onSave={onSave} />
    );

    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(getByText('Name is required')).toBeTruthy();
      expect(getByText('Unit is required')).toBeTruthy();
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  test('calls onSave with correct data on successful submit', async () => {
    const onClose = jest.fn();
    const onSave = jest.fn().mockResolvedValue(mockActivity);

    const { getByText, getByPlaceholderText } = render(
      <ActivityModal visible={true} onClose={onClose} onSave={onSave} />
    );

    const nameInput = getByPlaceholderText('e.g., Sales Calls');
    const unitInput = getByPlaceholderText('e.g., calls (will be pluralized)');
    const saveButton = getByText('Save');

    fireEvent.changeText(nameInput, 'Workouts');
    fireEvent.changeText(unitInput, 'workout');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        name: 'Workouts',
        unit: expect.any(String),
        inputType: 'number',
      });
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('calls onSelect after creating activity in builder context', async () => {
    const onClose = jest.fn();
    const onSelect = jest.fn();
    const onSave = jest.fn().mockResolvedValue(mockActivity);

    const { getByText, getByPlaceholderText } = render(
      <ActivityModal
        visible={true}
        onClose={onClose}
        onSave={onSave}
        onSelect={onSelect}
      />
    );

    const nameInput = getByPlaceholderText('e.g., Sales Calls');
    const unitInput = getByPlaceholderText('e.g., calls (will be pluralized)');
    const saveButton = getByText('Save');

    fireEvent.changeText(nameInput, 'Workouts');
    fireEvent.changeText(unitInput, 'workout');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(mockActivity);
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('displays save error on failure', async () => {
    const onClose = jest.fn();
    const onSave = jest.fn().mockRejectedValue(new Error('Network error'));

    const { getByText, getByPlaceholderText } = render(
      <ActivityModal visible={true} onClose={onClose} onSave={onSave} />
    );

    const nameInput = getByPlaceholderText('e.g., Sales Calls');
    const unitInput = getByPlaceholderText('e.g., calls (will be pluralized)');
    const saveButton = getByText('Save');

    fireEvent.changeText(nameInput, 'Workouts');
    fireEvent.changeText(unitInput, 'workout');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(getByText('Network error')).toBeTruthy();
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
