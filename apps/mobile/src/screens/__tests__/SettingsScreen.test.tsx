import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SettingsScreen } from '../SettingsScreen';
import { useAuthStore } from '../../stores/authStore';
import { logAuthErrorToCrashlytics } from '../../utils/crashlytics';

jest.mock('../../stores/authStore');
jest.mock('../../utils/crashlytics', () => ({
  logAuthErrorToCrashlytics: jest.fn(),
}));
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      goBack: jest.fn(),
    }),
  };
});

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockLogAuthErrorToCrashlytics = logAuthErrorToCrashlytics as jest.MockedFunction<typeof logAuthErrorToCrashlytics>;

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sign out button calls Firebase signOut', async () => {
    const mockSignOut = jest.fn(() => Promise.resolve());
    mockUseAuthStore.mockReturnValue({
      user: { uid: 'test-user' } as any,
      isInitialized: true,
      setUser: jest.fn(),
      setInitialized: jest.fn(),
      signOut: mockSignOut,
    });

    const { getByText } = render(<SettingsScreen />);

    const signOutButton = getByText('Sign Out');
    fireEvent.press(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  test('logs auth error to Crashlytics when sign out fails', async () => {
    const mockSignOut = jest.fn(() => 
      Promise.reject({ code: 'auth/network-request-failed', message: 'Network error' })
    );
    mockUseAuthStore.mockReturnValue({
      user: { uid: 'test-user' } as any,
      isInitialized: true,
      setUser: jest.fn(),
      setInitialized: jest.fn(),
      signOut: mockSignOut,
    });

    const { getByText } = render(<SettingsScreen />);

    const signOutButton = getByText('Sign Out');
    fireEvent.press(signOutButton);

    await waitFor(() => {
      expect(mockLogAuthErrorToCrashlytics).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'auth/network-request-failed' }),
        'sign_out'
      );
    });
  });
});
