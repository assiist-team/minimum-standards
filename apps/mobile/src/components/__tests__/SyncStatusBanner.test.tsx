import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { SyncStatusBanner } from '../SyncStatusBanner';

// Mock NetInfo
const mockNetInfo = {
  fetch: jest.fn(),
  addEventListener: jest.fn(),
};

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: mockNetInfo,
}));

describe('SyncStatusBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('NetInfo detects offline state correctly', async () => {
    mockNetInfo.fetch.mockResolvedValue({ isConnected: false });
    mockNetInfo.addEventListener.mockReturnValue(() => {});

    const { getByText } = render(<SyncStatusBanner />);

    await waitFor(() => {
      expect(getByText(/offline/i)).toBeTruthy();
    });
  });

  test('sync status banner displays when offline', async () => {
    mockNetInfo.fetch.mockResolvedValue({ isConnected: false });
    mockNetInfo.addEventListener.mockReturnValue(() => {});

    const { getByText } = render(<SyncStatusBanner />);

    await waitFor(() => {
      expect(getByText(/offline.*sync/i)).toBeTruthy();
    });
  });

  test('sync status banner clears when online', async () => {
    mockNetInfo.fetch.mockResolvedValue({ isConnected: true });
    const unsubscribe = jest.fn();
    mockNetInfo.addEventListener.mockReturnValue(unsubscribe);

    const { queryByText } = render(<SyncStatusBanner />);

    await waitFor(() => {
      expect(queryByText(/offline/i)).toBeNull();
    });
  });

  test('shows syncing indicator when coming back online', async () => {
    mockNetInfo.fetch.mockResolvedValue({ isConnected: false });
    let listener: ((state: any) => void) | null = null;
    mockNetInfo.addEventListener.mockImplementation((callback) => {
      listener = callback;
      return () => {};
    });

    const { getByText, queryByText, rerender } = render(<SyncStatusBanner />);

    await waitFor(() => {
      expect(getByText(/offline/i)).toBeTruthy();
    });

    // Simulate coming back online
    if (listener) {
      listener({ isConnected: true });
    }

    await waitFor(() => {
      expect(getByText(/syncing/i)).toBeTruthy();
    });

    // After sync completes, banner should clear
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(queryByText(/syncing/i)).toBeNull();
    });
  });

  test('handles NetInfo not being installed', () => {
    // Mock NetInfo to throw (not installed)
    jest.resetModules();
    jest.mock('@react-native-community/netinfo', () => {
      throw new Error('Module not found');
    });

    const { container } = render(<SyncStatusBanner />);
    // Should render without crashing
    expect(container).toBeTruthy();
  });
});
