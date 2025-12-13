import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { StandardsBuilderScreen } from '../StandardsBuilderScreen';
import { useStandardsBuilderStore } from '../../stores/standardsBuilderStore';
import { useStandards } from '../../hooks/useStandards';
import type { Activity, Standard } from '@minimum-standards/shared-model';
import { Alert } from 'react-native';

jest.mock('../../hooks/useStandards', () => ({
  useStandards: jest.fn(),
}));

jest.mock('../../components/ActivityLibraryModal', () => ({
  ActivityLibraryModal: jest.fn(() => null),
}));

const mockUseStandards = useStandards as jest.MockedFunction<
  typeof useStandards
>;

const mockActivity: Activity = {
  id: 'activity-1',
  name: 'Sales Calls',
  unit: 'calls',
  createdAtMs: 1,
  updatedAtMs: 1,
  deletedAtMs: null,
};

const mockStandard: Standard = {
  id: 'standard-1',
  activityId: mockActivity.id,
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

function setupHook(
  overrides: Partial<ReturnType<typeof useStandards>> = {}
) {
  const hookValue: ReturnType<typeof useStandards> = {
    standards: [],
    activeStandards: [],
    archivedStandards: [],
    pinnedStandards: [],
    orderedActiveStandards: [],
    pinOrder: [],
    loading: false,
    error: null,
    createStandard: jest.fn().mockResolvedValue(mockStandard),
    archiveStandard: jest.fn(),
    unarchiveStandard: jest.fn(),
    createLogEntry: jest.fn(),
    canLogStandard: jest.fn().mockReturnValue(true),
    pinStandard: jest.fn(),
    unpinStandard: jest.fn(),
    movePinnedStandard: jest.fn(),
    ...overrides,
  };

  mockUseStandards.mockReturnValue(hookValue);
  return hookValue;
}

describe('StandardsBuilderScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    setupHook();
    useStandardsBuilderStore.getState().reset();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => 0);
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  test('summary preview updates when preset selected', () => {
    useStandardsBuilderStore.getState().setSelectedActivity(mockActivity);
    const { getByText, getByPlaceholderText } = render(
      <StandardsBuilderScreen onBack={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Minimum value'), '100');
    fireEvent.press(getByText('Daily'));

    expect(getByText('100 calls / day')).toBeTruthy();
  });

  test('archive toggle shows guardrail copy', () => {
    const { getByText, getByRole } = render(
      <StandardsBuilderScreen onBack={jest.fn()} />
    );
    const switchControl = getByRole('switch');
    fireEvent(switchControl, 'valueChange', true);
    expect(
      getByText('Archived Standards cannot accept new log entries.')
    ).toBeTruthy();
  });

  test('save invokes createStandard with payload', async () => {
    const hookValue = setupHook();
    useStandardsBuilderStore.getState().setSelectedActivity(mockActivity);
    const { getByText, getByPlaceholderText } = render(
      <StandardsBuilderScreen onBack={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Minimum value'), '200');
    fireEvent.press(getByText('Weekly'));
    fireEvent.press(getByText('Save Standard'));

    await waitFor(() => expect(hookValue.createStandard).toHaveBeenCalled());
    expect(hookValue.createStandard).toHaveBeenCalledWith(
      expect.objectContaining({
        activityId: mockActivity.id,
        minimum: 200,
        cadence: { interval: 1, unit: 'week' },
      })
    );
  });
});
