import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ArchivedStandardsScreen } from '../ArchivedStandardsScreen';
import { useStandards } from '../../hooks/useStandards';
import type { Standard } from '@minimum-standards/shared-model';

jest.mock('../../hooks/useStandards', () => ({
  useStandards: jest.fn(),
}));

const mockUseStandards = useStandards as jest.MockedFunction<
  typeof useStandards
>;

const archivedStandard: Standard = {
  id: 'std-1',
  activityId: 'activity-1',
  minimum: 150,
  unit: 'calls',
  cadence: { interval: 1, unit: 'week' },
  state: 'archived',
  summary: '150 calls / week',
  archivedAtMs: 1_700_000_000_000,
  createdAtMs: 1,
  updatedAtMs: 1,
  deletedAtMs: null,
};

function setupHook(overrides: Partial<ReturnType<typeof useStandards>> = {}) {
  mockUseStandards.mockReturnValue({
    standards: [],
    activeStandards: [],
    archivedStandards: [archivedStandard],
    orderedActiveStandards: [],
    loading: false,
    error: null,
    createStandard: jest.fn(),
    archiveStandard: jest.fn(),
    unarchiveStandard: jest.fn(),
    createLogEntry: jest.fn(),
    canLogStandard: jest.fn(),
    ...overrides,
  });
}

describe('ArchivedStandardsScreen', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    setupHook();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('renders inactive summary and badge', () => {
    const { getByText } = render(
      <ArchivedStandardsScreen onBack={jest.fn()} />
    );
    expect(getByText('150 calls / week')).toBeTruthy();
    expect(getByText('Inactive')).toBeTruthy();
  });

  test('log button is disabled for inactive standards', () => {
    const { getByLabelText } = render(
      <ArchivedStandardsScreen onBack={jest.fn()} />
    );
    const logButton = getByLabelText('Logging disabled for inactive standards');
    expect(logButton.props.accessibilityState?.disabled).toBe(true);
  });

  test('activate button invokes handler', () => {
    const unarchiveStandard = jest.fn();
    setupHook({ unarchiveStandard });
    const { getByLabelText } = render(
      <ArchivedStandardsScreen onBack={jest.fn()} />
    );

    fireEvent.press(getByLabelText('Activate standard'));
    expect(unarchiveStandard).toHaveBeenCalledWith('std-1');
  });
});
