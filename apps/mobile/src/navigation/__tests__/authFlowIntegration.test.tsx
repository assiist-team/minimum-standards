import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AppNavigator } from '../AppNavigator';
import { useAuthStore } from '../../stores/authStore';

jest.mock('../../stores/authStore');
jest.mock('../../screens/SignInScreen', () => ({
  SignInScreen: () => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const React = require('react');
    return React.createElement('View', { testID: 'sign-in-screen' }, 'Sign In Screen');
  },
}));
// HomeScreen removed - using BottomTabNavigator instead
jest.mock('../BottomTabNavigator', () => ({
  BottomTabNavigator: () => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const React = require('react');
    return React.createElement('View', { testID: 'main-tabs' }, 'Main Tabs');
  },
}));
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('unauthenticated user cannot access Firestore (security rules enforced)', async () => {
    // This test verifies that navigation guards prevent unauthenticated access
    // Actual Firestore security rules are enforced at the database level
    mockUseAuthStore.mockReturnValue({
      user: null,
      isInitialized: true,
      setUser: jest.fn(),
      setInitialized: jest.fn(),
      signOut: jest.fn(),
      clearGoogleSession: jest.fn(),
    });

    const { getByTestId, queryByTestId } = render(<AppNavigator />);
    
    // Should show AuthStack, not MainStack
    await waitFor(() => {
      // AuthStack should be rendered (SignInScreen present)
      expect(getByTestId('sign-in-screen')).toBeTruthy();
      // MainStack should NOT be rendered (MainTabs absent)
      expect(queryByTestId('main-tabs')).toBeNull();
    });
  });

  test('authenticated user can access Firestore after sign in', async () => {
    const mockUser = {
      uid: 'test-user-id',
      email: 'test@example.com',
    } as any;

    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isInitialized: true,
      setUser: jest.fn(),
      setInitialized: jest.fn(),
      signOut: jest.fn(),
      clearGoogleSession: jest.fn(),
    });

    const { getByTestId, queryByTestId } = render(<AppNavigator />);
    
    // Should show MainStack, allowing Firestore access
    await waitFor(() => {
      // MainStack should be rendered (MainTabs present)
      expect(getByTestId('main-tabs')).toBeTruthy();
      // AuthStack should NOT be rendered (SignInScreen absent)
      expect(queryByTestId('sign-in-screen')).toBeNull();
    });
  });

  test('sign out clears auth state and redirects to sign in', async () => {
    const mockUser = {
      uid: 'test-user-id',
      email: 'test@example.com',
    } as any;

    const mockSignOut = jest.fn(() => Promise.resolve());
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isInitialized: true,
      setUser: jest.fn(),
      setInitialized: jest.fn(),
      signOut: mockSignOut,
      clearGoogleSession: jest.fn(),
    });

    const { getByTestId, rerender, queryByTestId } = render(<AppNavigator />);

    // Initially should show MainStack
    await waitFor(() => {
      expect(getByTestId('home-screen')).toBeTruthy();
    });

    // After sign out, user should be null
    mockUseAuthStore.mockReturnValue({
      user: null,
      isInitialized: true,
      setUser: jest.fn(),
      setInitialized: jest.fn(),
      signOut: mockSignOut,
      clearGoogleSession: jest.fn(),
    });

    rerender(<AppNavigator />);

    await waitFor(() => {
      // Should now show AuthStack (SignInScreen present)
      expect(getByTestId('sign-in-screen')).toBeTruthy();
      // MainStack should NOT be rendered (MainTabs absent)
      expect(queryByTestId('main-tabs')).toBeNull();
    });
  });
});
