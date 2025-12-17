import { create } from 'zustand';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { firebaseAuth } from '../firebase/firebaseApp';

export interface AuthState {
  // Current authenticated user
  user: FirebaseAuthTypes.User | null;
  setUser: (user: FirebaseAuthTypes.User | null) => void;

  // Whether auth state has been initialized
  isInitialized: boolean;
  setInitialized: (isInitialized: boolean) => void;

  // Sign out action
  signOut: () => Promise<void>;

  // Initialize auth state listener (call once on app startup)
  initialize: () => () => void; // Returns cleanup function
}

const initialState = {
  user: null,
  isInitialized: false,
};

// Store the unsubscribe function globally to prevent duplicate listeners
let unsubscribeAuthState: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setUser: (user) => {
    set({ user });
  },

  setInitialized: (isInitialized) => {
    set({ isInitialized });
  },

  signOut: async () => {
    await firebaseAuth.signOut();
    set({ user: null });
  },

  initialize: () => {
    console.log('[AuthStore] Starting auth initialization...');
    
    // Prevent duplicate listeners
    if (unsubscribeAuthState) {
      console.log('[AuthStore] Already initialized, skipping duplicate initialization');
      // Return a no-op cleanup function if already initialized
      return () => {
        // Already initialized, cleanup handled elsewhere
      };
    }

    // Check current user synchronously to set initial state immediately
    // This prevents showing the sign-in screen if user is already authenticated
    console.log('[AuthStore] Checking current user synchronously...');
    try {
      const currentUser = firebaseAuth.currentUser;
      const uid = currentUser?.uid;
      console.log('[AuthStore] Current user check result:', uid ? `User ID: ${uid}` : 'No current user');
      if (currentUser && uid) {
        console.log('[AuthStore] Authenticated user UID available for Firestore operations:', uid);
        console.log('[AuthStore] Setting initial state with current user');
        set({ user: currentUser, isInitialized: true });
      } else {
        console.warn('[AuthStore] No authenticated user - Firestore operations will fail');
      }
    } catch (error) {
      console.error('[AuthStore] ERROR: Failed to check current user:', error);
      // Continue with initialization even if current user check fails
    }

    // Timeout fallback: if onAuthStateChanged doesn't fire within 3 seconds,
    // assume no user and proceed (prevents infinite loading screen)
    console.log('[AuthStore] Setting up 3s timeout fallback...');
    const timeoutId = setTimeout(() => {
      console.log('[AuthStore] Timeout fired - checking initialization state...');
      const state = useAuthStore.getState();
      if (!state.isInitialized) {
        console.warn('[AuthStore] Auth initialization timeout - proceeding without auth state');
        set({ user: null, isInitialized: true });
      } else {
        console.log('[AuthStore] Timeout fired but already initialized, ignoring');
      }
    }, 3000);

    // Set up auth state listener for future changes
    // Note: onAuthStateChanged fires immediately with current auth state,
    // so if currentUser was null, the listener will fire with null and set isInitialized: true
    console.log('[AuthStore] Setting up onAuthStateChanged listener...');
    try {
      unsubscribeAuthState = firebaseAuth.onAuthStateChanged((user) => {
        const uid = user?.uid;
        console.log('[AuthStore] onAuthStateChanged callback fired:', uid ? `User ID: ${uid}` : 'No user');
        if (uid) {
          console.log('[AuthStore] Authenticated user UID available for Firestore operations:', uid);
        } else {
          console.warn('[AuthStore] No authenticated user - Firestore operations will fail');
        }
        clearTimeout(timeoutId);
        set({ user, isInitialized: true });
        console.log('[AuthStore] Auth state updated, isInitialized: true');
      });
      console.log('[AuthStore] onAuthStateChanged listener registered successfully');
    } catch (error) {
      console.error('[AuthStore] ERROR: Failed to set up onAuthStateChanged listener:', error);
      // Clear timeout and set initialized to true to prevent infinite loading
      clearTimeout(timeoutId);
      set({ user: null, isInitialized: true });
    }

    // Return cleanup function
    const cleanup = () => {
      console.log('[AuthStore] Cleanup called');
      clearTimeout(timeoutId);
      if (unsubscribeAuthState) {
        unsubscribeAuthState();
        unsubscribeAuthState = null;
      }
    };
    return cleanup;
  },
}));
