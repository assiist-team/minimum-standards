import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AppNavigator } from '../AppNavigator';
import { useAuthStore } from '../../stores/authStore';

// Mock dependencies
jest.mock('../../stores/authStore');
jest.mock('../../components/LoadingScreen');
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

describe('AppNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading screen when auth state is not initialized', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isInitialized: false,
      setUser: jest.fn(),
      setInitialized: jest.fn(),
      signOut: jest.fn(),
      clearGoogleSession: jest.fn(),
    });

    const { getByText } = render(<AppNavigator />);
    
    // Should render LoadingScreen when not initialized
    expect(getByText('Loading...')).toBeTruthy();
  });

  test('shows AuthStack when user is not authenticated and initialized', async () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isInitialized: true,
      setUser: jest.fn(),
      setInitialized: jest.fn(),
      signOut: jest.fn(),
      clearGoogleSession: jest.fn(),
    });

    const { getByTestId } = render(<AppNavigator />);
    
    await waitFor(() => {
      // AuthStack should be rendered - verify SignInScreen is present
      expect(getByTestId('sign-in-screen')).toBeTruthy();
    });
  });

  test('shows MainStack when user is authenticated and initialized', async () => {
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

    const { getByTestId } = render(<AppNavigator />);
    
    await waitFor(() => {
      // MainStack should be rendered - verify BottomTabNavigator is present
      expect(getByTestId('main-tabs')).toBeTruthy();
    });
  });

  test('navigation updates when auth state changes', async () => {
    // Start unauthenticated
    mockUseAuthStore.mockReturnValue({
      user: null,
      isInitialized: true,
      setUser: jest.fn(),
      setInitialized: jest.fn(),
      signOut: jest.fn(),
      clearGoogleSession: jest.fn(),
    });

    const { getByTestId, rerender } = render(<AppNavigator />);
    
    await waitFor(() => {
      // Should show AuthStack initially
      expect(getByTestId('sign-in-screen')).toBeTruthy();
    });

    // Update to authenticated
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

    rerender(<AppNavigator />);

    await waitFor(() => {
      // Should now show MainStack
      expect(getByTestId('home-screen')).toBeTruthy();
    });
  });
});
