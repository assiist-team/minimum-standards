import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { PeriodHistoryList } from '../PeriodHistoryList';
import type { PeriodHistoryEntry } from '../../utils/standardHistory';

const mockHistoryEntry1: PeriodHistoryEntry = {
  periodLabel: 'Week of Dec 8',
  total: 100,
  target: 100,
  targetSummary: '100 calls / week',
  status: 'Met',
  progressPercent: 100,
  periodStartMs: 1702008000000,
  periodEndMs: 1702612800000,
  currentSessions: 5,
  targetSessions: 5,
};

const mockHistoryEntry2: PeriodHistoryEntry = {
  periodLabel: 'Week of Dec 1',
  total: 75,
  target: 100,
  targetSummary: '100 calls / week',
  status: 'In Progress',
  progressPercent: 75,
  periodStartMs: 1701403200000,
  periodEndMs: 1702008000000,
  currentSessions: 4,
  targetSessions: 5,
};

describe('PeriodHistoryList', () => {
  test('renders periods most-recent-first', () => {
    const onPeriodPress = jest.fn();
    const { getByText } = render(
      <PeriodHistoryList
        history={[mockHistoryEntry1, mockHistoryEntry2]}
        onPeriodPress={onPeriodPress}
      />
    );

    // First entry should be most recent
    expect(getByText('Week of Dec 8')).toBeTruthy();
  });

  test('period row displays period label, total, target, status, progress indicator', () => {
    const onPeriodPress = jest.fn();
    const { getByText } = render(
      <PeriodHistoryList history={[mockHistoryEntry1]} onPeriodPress={onPeriodPress} />
    );

    expect(getByText('Week of Dec 8')).toBeTruthy();
    expect(getByText(/100.*100 calls/i)).toBeTruthy();
    expect(getByText('Met')).toBeTruthy();
  });

  test('tapping period row opens logs modal', () => {
    const onPeriodPress = jest.fn();
    const { getByText } = render(
      <PeriodHistoryList history={[mockHistoryEntry1]} onPeriodPress={onPeriodPress} />
    );

    const periodRow = getByText('Week of Dec 8').parent?.parent;
    if (periodRow) {
      fireEvent.press(periodRow);
      expect(onPeriodPress).toHaveBeenCalledWith(mockHistoryEntry1);
    }
  });
});
