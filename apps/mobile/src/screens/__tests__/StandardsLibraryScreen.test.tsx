import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import { StandardsLibraryScreen } from '../StandardsLibraryScreen';
import { useStandardsLibrary } from '../../hooks/useStandardsLibrary';
import { useActivities } from '../../hooks/useActivities';
import { Standard, Activity } from '@minimum-standards/shared-model';

jest.mock('../../hooks/useStandardsLibrary', () => ({
  useStandardsLibrary: jest.fn(),
}));

jest.mock('../../hooks/useActivities', () => ({
  useActivities: jest.fn(),
}));

const mockUseStandardsLibrary = useStandardsLibrary as jest.MockedFunction<
  typeof useStandardsLibrary
>;
const mockUseActivities = useActivities as jest.MockedFunction<
  typeof useActivities
>;

const mockActivity: Activity = {
  id: 'activity1',
  name: 'Sales Calls',
  unit: 'calls',
  createdAtMs: 1000,
  updatedAtMs: 1000,
  deletedAtMs: null,
};

const mockStandard1: Standard = {
  id: '1',
  activityId: 'activity1',
  minimum: 1000,
  unit: 'calls',
  cadence: { interval: 1, unit: 'week' },
  state: 'active',
  summary: '1000 calls / week',
  archivedAtMs: null,
  createdAtMs: 1000,
  updatedAtMs: 1000,
  deletedAtMs: null,
};

const mockStandard2: Standard = {
  id: '2',
  activityId: 'activity2',
  minimum: 50,
  unit: 'minutes',
  cadence: { interval: 1, unit: 'day' },
  state: 'archived',
  summary: '50 minutes / day',
  archivedAtMs: 2000,
  createdAtMs: 2000,
  updatedAtMs: 2000,
  deletedAtMs: null,
};

function setupHooks(
  standardsOverrides: Partial<ReturnType<typeof useStandardsLibrary>> = {},
  activitiesOverrides: Partial<ReturnType<typeof useActivities>> = {}
) {
  mockUseStandardsLibrary.mockReturnValue({
    allStandards: [mockStandard1, mockStandard2],
    activeStandards: [mockStandard1],
    archivedStandards: [mockStandard2],
    searchQuery: '',
    setSearchQuery: jest.fn(),
    loading: false,
    error: null,
    archiveStandard: jest.fn(),
    unarchiveStandard: jest.fn(),
    ...standardsOverrides,
  });

  mockUseActivities.mockReturnValue({
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
    ...activitiesOverrides,
  });
}

describe('StandardsLibraryScreen', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders header with back button', () => {
    setupHooks();
    const { getByText } = render(
      <StandardsLibraryScreen onBack={mockOnBack} />
    );
    expect(getByText('Standards Library')).toBeTruthy();
    expect(getByText('← Back')).toBeTruthy();
  });

  test('calls onBack when back button is pressed', () => {
    setupHooks();
    const { getByText } = render(
      <StandardsLibraryScreen onBack={mockOnBack} />
    );
    fireEvent.press(getByText('← Back'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  test('renders search input', () => {
    setupHooks();
    const { getByLabelText } = render(
      <StandardsLibraryScreen onBack={mockOnBack} />
    );
    expect(getByLabelText('Standards search input')).toBeTruthy();
  });

  test('renders tab navigation with Active and Inactive tabs', () => {
    setupHooks();
    const { getByText } = render(
      <StandardsLibraryScreen onBack={mockOnBack} />
    );
    expect(getByText('Active')).toBeTruthy();
    expect(getByText('Inactive')).toBeTruthy();
  });

  test('shows active standards by default', () => {
    setupHooks();
    const { getByText } = render(
      <StandardsLibraryScreen onBack={mockOnBack} />
    );
    expect(getByText('1000 calls / week')).toBeTruthy();
    expect(getByText('Sales Calls')).toBeTruthy();
  });

  test('switches to inactive tab when clicked', () => {
    setupHooks();
    const { getByText } = render(
      <StandardsLibraryScreen onBack={mockOnBack} />
    );
    fireEvent.press(getByText('Inactive'));
    expect(getByText('50 minutes / day')).toBeTruthy();
  });

  test('shows deactivate button for active standards', () => {
    setupHooks();
    const { getByLabelText } = render(
      <StandardsLibraryScreen onBack={mockOnBack} />
    );
    expect(getByLabelText(/deactivate/i)).toBeTruthy();
  });

  test('shows activate button for inactive standards', () => {
    setupHooks();
    const { getByLabelText, getByText } = render(
      <StandardsLibraryScreen onBack={mockOnBack} />
    );
    fireEvent.press(getByText('Inactive'));
    expect(getByLabelText(/activate/i)).toBeTruthy();
  });

  test('calls archiveStandard when deactivate button is pressed', async () => {
    const mockArchiveStandard = jest.fn().mockResolvedValue(undefined);
    setupHooks({ archiveStandard: mockArchiveStandard });
    const { getByLabelText } = render(
      <StandardsLibraryScreen onBack={mockOnBack} />
    );
    fireEvent.press(getByLabelText(/deactivate/i));
    await waitFor(() => {
      expect(mockArchiveStandard).toHaveBeenCalledWith('1');
    });
  });

  test('calls unarchiveStandard when activate button is pressed', async () => {
    const mockUnarchiveStandard = jest.fn().mockResolvedValue(undefined);
    setupHooks({ unarchiveStandard: mockUnarchiveStandard });
    const { getByText, getByLabelText } = render(
      <StandardsLibraryScreen onBack={mockOnBack} />
    );
    fireEvent.press(getByText('Inactive'));
    fireEvent.press(getByLabelText(/activate/i));
    await waitFor(() => {
      expect(mockUnarchiveStandard).toHaveBeenCalledWith('2');
    });
  });

  test('shows loading indicator when loading', () => {
    setupHooks({ loading: true });
    const { UNSAFE_getByType } = render(
      <StandardsLibraryScreen onBack={mockOnBack} />
    );
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  test('shows empty state when no standards match', () => {
    setupHooks({ activeStandards: [], archivedStandards: [] });
    const { getByText } = render(
      <StandardsLibraryScreen onBack={mockOnBack} />
    );
    expect(getByText('No active standards')).toBeTruthy();
  });

  test('shows empty state message for search when query is present', () => {
    setupHooks({
      activeStandards: [],
      archivedStandards: [],
      searchQuery: 'xyz',
    });
    const { getByText } = render(
      <StandardsLibraryScreen onBack={mockOnBack} />
    );
    expect(getByText('No standards match your search')).toBeTruthy();
  });

  test('calls onSelectStandard when standard is selected', () => {
    const mockOnSelectStandard = jest.fn();
    setupHooks();
    const { getByText } = render(
      <StandardsLibraryScreen
        onBack={mockOnBack}
        onSelectStandard={mockOnSelectStandard}
      />
    );
    fireEvent.press(getByText('1000 calls / week'));
    expect(mockOnSelectStandard).toHaveBeenCalledWith(mockStandard1);
    // Note: onBack is not called here - it's handled by the modal wrapper when used as a modal,
    // and shouldn't be called when used as a main screen (where we navigate forward)
    expect(mockOnBack).not.toHaveBeenCalled();
  });

  test('displays error message when error occurs', () => {
    setupHooks({ error: new Error('Test error') });
    const { getByText } = render(
      <StandardsLibraryScreen onBack={mockOnBack} />
    );
    expect(getByText('Error: Test error')).toBeTruthy();
  });

  test('displays cadence information correctly', () => {
    setupHooks();
    const { getByText } = render(
      <StandardsLibraryScreen onBack={mockOnBack} />
    );
    expect(getByText('every week')).toBeTruthy();
  });

  test('displays minimum and unit information', () => {
    setupHooks();
    const { getByText } = render(
      <StandardsLibraryScreen onBack={mockOnBack} />
    );
    expect(getByText('Minimum: 1000 calls')).toBeTruthy();
  });
});
