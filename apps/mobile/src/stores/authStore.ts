import { create } from 'zustand';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

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
    await auth().signOut();
    set({ user: null });
  },

  initialize: () => {
    // Prevent duplicate listeners
    if (unsubscribeAuthState) {
      // Return a no-op cleanup function if already initialized
      return () => {
        // Already initialized, cleanup handled elsewhere
      };
    }

    // Set up auth state listener
    unsubscribeAuthState = auth().onAuthStateChanged((user) => {
      set({ user, isInitialized: true });
    });

    // Return cleanup function
    const cleanup = () => {
      if (unsubscribeAuthState) {
        unsubscribeAuthState();
        unsubscribeAuthState = null;
      }
    };
    return cleanup;
  },
}));
