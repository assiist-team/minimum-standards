import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * Hook that initializes the auth state listener on app mount.
 * The store itself now manages the auth state subscription.
 */
export function useAuthInitialization() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    console.log('[useAuthInitialization] Effect running - calling initialize()');
    // Initialize auth state listener (returns cleanup function)
    const cleanup = initialize();
    console.log('[useAuthInitialization] initialize() returned cleanup function');

    // Cleanup listener on unmount
    return () => {
      console.log('[useAuthInitialization] Cleanup invoked - tearing down auth listener');
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [initialize]);
}
