import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * Hook that initializes the auth state listener on app mount.
 * The store itself now manages the auth state subscription.
 */
export function useAuthInitialization() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Initialize auth state listener (returns cleanup function)
    const cleanup = initialize();

    // Cleanup listener on unmount
    return cleanup;
  }, [initialize]);
}
