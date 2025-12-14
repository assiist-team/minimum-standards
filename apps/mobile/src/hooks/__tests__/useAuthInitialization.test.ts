import { renderHook, waitFor } from '@testing-library/react-native';
import { useAuthInitialization } from '../useAuthInitialization';
import auth from '@react-native-firebase/auth';
import { useAuthStore } from '../../stores/authStore';

// Mock Firebase Auth
jest.mock('@react-native-firebase/auth', () => {
  let currentUser: any = null;
  let listeners: Array<(user: any) => void> = [];

  return {
    __esModule: true,
    default: jest.fn(() => ({
      currentUser,
      onAuthStateChanged: (callback: (user: any) => void) => {
        listeners.push(callback);
        // Immediately call with current user
        callback(currentUser);
        return () => {
          listeners = listeners.filter((l) => l !== callback);
        };
      },
      signOut: jest.fn(() => Promise.resolve()),
      // Helper to simulate auth state changes in tests
      _setCurrentUser: (user: any) => {
        currentUser = user;
        listeners.forEach((listener) => listener(user));
      },
    })),
  };
});

describe('useAuthInitialization', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useAuthStore());
    result.current.setUser(null);
    result.current.setInitialized(false);
  });

  test('onAuthStateChanged listener updates store when user signs in', async () => {
    const mockUser = {
      uid: 'test-user-id',
      email: 'test@example.com',
    };

    renderHook(() => useAuthInitialization());

    // Trigger auth state change
    (auth() as any)._setCurrentUser(mockUser);

    await waitFor(() => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isInitialized).toBe(true);
    });
  });

  test('onAuthStateChanged listener updates store when user signs out', async () => {
    const mockUser = {
      uid: 'test-user-id',
      email: 'test@example.com',
    };

    renderHook(() => useAuthInitialization());

    // First sign in
    (auth() as any)._setCurrentUser(mockUser);

    await waitFor(() => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.user).toEqual(mockUser);
    });

    // Then sign out
    (auth() as any)._setCurrentUser(null);

    await waitFor(() => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.user).toBeNull();
      expect(result.current.isInitialized).toBe(true);
    });
  });

  test('store sets isInitialized: true after first auth state change', async () => {
    renderHook(() => useAuthInitialization());

    // Trigger first auth state change
    (auth() as any)._setCurrentUser(null);

    await waitFor(() => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.isInitialized).toBe(true);
    });
  });
});
