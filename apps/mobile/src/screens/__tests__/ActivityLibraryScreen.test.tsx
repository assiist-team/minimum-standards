import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActivityLibraryScreen } from '../ActivityLibraryScreen';
import { useActivities } from '../../hooks/useActivities';
import type { Activity } from '@minimum-standards/shared-model';

jest.mock('../../hooks/useActivities', () => ({
  useActivities: jest.fn(),
}));

const mockUseActivities = useActivities as jest.MockedFunction<
  typeof useActivities
>;

const baseActivity: Activity = {
  id: 'a1',
  name: 'Sales Calls',
  unit: 'calls',
  createdAtMs: 1,
  updatedAtMs: 1,
  deletedAtMs: null,
};

function setupHook(overrides: Partial<ReturnType<typeof useActivities>> = {}) {
  mockUseActivities.mockReturnValue({
    activities: [baseActivity],
    recentActivities: [baseActivity],
    loading: false,
    error: null,
    searchQuery: '',
    setSearchQuery: jest.fn(),
    createActivity: jest.fn(),
    updateActivity: jest.fn(),
    deleteActivity: jest.fn(),
    restoreActivity: jest.fn(),
    ...overrides,
  });
}

describe('ActivityLibraryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows prefocus copy before searching', () => {
    setupHook();
    const { getByText } = render(<ActivityLibraryScreen />);
    expect(getByText('Start with search')).toBeTruthy();
  });

  test('focus reveals recent activities', () => {
    setupHook();
    const { getByLabelText, getByText } = render(<ActivityLibraryScreen />);
    const searchInput = getByLabelText('Activity search input');
    fireEvent(searchInput, 'focus');
    expect(getByText('Recent activities')).toBeTruthy();
    expect(getByText('Sales Calls')).toBeTruthy();
  });

  test('typing shows search results view', () => {
    setupHook({
      activities: [
        {
          ...baseActivity,
          id: 'a2',
          name: 'Weekly Planning',
        },
      ],
      searchQuery: 'plan',
    });
    const { getByLabelText, getByText } = render(<ActivityLibraryScreen />);
    const searchInput = getByLabelText('Activity search input');
    fireEvent(searchInput, 'focus');
    expect(getByText('Search results')).toBeTruthy();
  });

  test('renders inline create button', () => {
    setupHook();
    const { getByText } = render(<ActivityLibraryScreen />);
    expect(getByText('+ Create')).toBeTruthy();
  });
});
