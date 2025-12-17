import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { StandardsBuilderScreen } from '../StandardsBuilderScreen';
import { useStandardsBuilderStore } from '../../stores/standardsBuilderStore';
import { useStandards } from '../../hooks/useStandards';
import { useActivities } from '../../hooks/useActivities';
import { findMatchingStandard } from '../../utils/standardsFilter';
import type { Activity, Standard } from '@minimum-standards/shared-model';
import { Alert } from 'react-native';

jest.mock('../../hooks/useStandards', () => ({
  useStandards: jest.fn(),
}));

jest.mock('../../components/ActivityLibraryModal', () => ({
  ActivityLibraryModal: jest.fn(() => null),
}));

jest.mock('../../components/StandardsLibraryModal', () => ({
  StandardsLibraryModal: jest.fn(() => null),
}));

jest.mock('../../components/ActivityModal', () => ({
  ActivityModal: jest.fn(() => null),
}));

jest.mock('../../hooks/useActivities', () => ({
  useActivities: jest.fn(),
}));

jest.mock('../../utils/standardsFilter', () => ({
  findMatchingStandard: jest.fn(),
}));

const mockUseStandards = useStandards as jest.MockedFunction<
  typeof useStandards
>;
const mockUseActivities = useActivities as jest.MockedFunction<
  typeof useActivities
>;
const mockFindMatchingStandard = findMatchingStandard as jest.MockedFunction<
  typeof findMatchingStandard
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
    updateLogEntry: jest.fn(),
    deleteLogEntry: jest.fn(),
    restoreLogEntry: jest.fn(),
    canLogStandard: jest.fn().mockReturnValue(true),
    pinStandard: jest.fn(),
    unpinStandard: jest.fn(),
    movePinnedStandard: jest.fn(),
    ...overrides,
  };

  mockUseStandards.mockReturnValue(hookValue);
  return hookValue;
}

function setupActivitiesHook(
  overrides: Partial<ReturnType<typeof useActivities>> = {}
) {
  const hookValue: ReturnType<typeof useActivities> = {
    activities: [mockActivity],
    recentActivities: [],
    loading: false,
    error: null,
    searchQuery: '',
    setSearchQuery: jest.fn(),
    createActivity: jest.fn(),
    updateActivity: jest.fn(),
    deleteActivity: jest.fn(),
    restoreActivity: jest.fn(),
    ...overrides,
  };

  mockUseActivities.mockReturnValue(hookValue);
  return hookValue;
}

describe('StandardsBuilderScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    setupHook();
    setupActivitiesHook();
    mockFindMatchingStandard.mockReturnValue(undefined);
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
    fireEvent.press(getByText('Save'));

    await waitFor(() => expect(hookValue.createStandard).toHaveBeenCalled());
    expect(hookValue.createStandard).toHaveBeenCalledWith(
      expect.objectContaining({
        activityId: mockActivity.id,
        minimum: 200,
        cadence: { interval: 1, unit: 'week' },
      })
    );
  });

  // Task Group 4: Pre-fill and duplicate prevention tests
  test('renders "Create" and "Select" buttons', () => {
    const { getByText } = render(<StandardsBuilderScreen onBack={jest.fn()} />);
    expect(getByText('Create')).toBeTruthy();
    expect(getByText('Select')).toBeTruthy();
  });

  test('pre-fills form when standard is selected', () => {
    const { StandardsLibraryModal } = require('../../components/StandardsLibraryModal');
    StandardsLibraryModal.mockImplementation(({ onSelectStandard }: any) => {
      // Simulate selecting a standard
      React.useEffect(() => {
        onSelectStandard(mockStandard);
      }, [onSelectStandard]);
      return null;
    });

    render(<StandardsBuilderScreen onBack={jest.fn()} />);

    const store = useStandardsBuilderStore.getState();
    expect(store.selectedActivity).toEqual(mockActivity);
    expect(store.cadence).toEqual(mockStandard.cadence);
    expect(store.minimum).toEqual(mockStandard.minimum);
    expect(store.unitOverride).toEqual(mockStandard.unit);
  });

  test('unarchives existing standard when duplicate found and archived', async () => {
    const archivedStandard: Standard = {
      ...mockStandard,
      state: 'archived',
      archivedAtMs: 2000,
    };
    const hookValue = setupHook({ standards: [archivedStandard] });
    mockFindMatchingStandard.mockReturnValue(archivedStandard);

    useStandardsBuilderStore.getState().setSelectedActivity(mockActivity);
    useStandardsBuilderStore.getState().setCadence(mockStandard.cadence);
    useStandardsBuilderStore.getState().setMinimum(mockStandard.minimum);
    useStandardsBuilderStore.getState().setUnitOverride(mockStandard.unit);

    const { getByText } = render(<StandardsBuilderScreen onBack={jest.fn()} />);
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(hookValue.unarchiveStandard).toHaveBeenCalledWith(archivedStandard.id);
      expect(hookValue.createStandard).not.toHaveBeenCalled();
    });
  });

  test('shows error when duplicate active standard found', async () => {
    const hookValue = setupHook({ standards: [mockStandard] });
    mockFindMatchingStandard.mockReturnValue(mockStandard);

    useStandardsBuilderStore.getState().setSelectedActivity(mockActivity);
    useStandardsBuilderStore.getState().setCadence(mockStandard.cadence);
    useStandardsBuilderStore.getState().setMinimum(mockStandard.minimum);
    useStandardsBuilderStore.getState().setUnitOverride(mockStandard.unit);

    const { getByText } = render(<StandardsBuilderScreen onBack={jest.fn()} />);
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(getByText('A Standard with these values already exists')).toBeTruthy();
      expect(hookValue.createStandard).not.toHaveBeenCalled();
      expect(hookValue.unarchiveStandard).not.toHaveBeenCalled();
    });
  });

  test('creates new standard when no duplicate found', async () => {
    const hookValue = setupHook();
    mockFindMatchingStandard.mockReturnValue(undefined);

    useStandardsBuilderStore.getState().setSelectedActivity(mockActivity);
    useStandardsBuilderStore.getState().setCadence(mockStandard.cadence);
    useStandardsBuilderStore.getState().setMinimum(mockStandard.minimum);
    useStandardsBuilderStore.getState().setUnitOverride(mockStandard.unit);

    const { getByText } = render(<StandardsBuilderScreen onBack={jest.fn()} />);
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(hookValue.createStandard).toHaveBeenCalled();
      expect(hookValue.unarchiveStandard).not.toHaveBeenCalled();
    });
  });
});
