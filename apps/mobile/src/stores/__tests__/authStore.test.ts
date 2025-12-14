import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.setUser(null);
      result.current.setInitialized(false);
    });
  });

  test('auth store initializes with isInitialized: false and user: null', () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.isInitialized).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test('setUser updates user state', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUser = {
      uid: 'test-user-id',
      email: 'test@example.com',
    } as any;

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  test('setInitialized updates initialization state', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setInitialized(true);
    });

    expect(result.current.isInitialized).toBe(true);
  });

  test('signOut clears user state', async () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUser = {
      uid: 'test-user-id',
      email: 'test@example.com',
    } as any;

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
  });
});
