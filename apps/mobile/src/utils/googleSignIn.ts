import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Config from 'react-native-config';

/**
 * Initializes Google Sign-In with Firebase configuration.
 * Call this once during app startup (e.g., in App.tsx).
 * 
 * Note: Configure the webClientId in your .env file.
 * Get it from Firebase Console > Authentication > Sign-in method > Google > Web client ID
 */
export function initializeGoogleSignIn() {
  const webClientId = Config.GOOGLE_SIGN_IN_WEB_CLIENT_ID;

  if (!webClientId) {
    console.warn(
      'Google Sign-In webClientId not configured. ' +
      'Set GOOGLE_SIGN_IN_WEB_CLIENT_ID in your .env file. ' +
      'See .env.example for reference.'
    );
    return;
  }

  GoogleSignin.configure({
    webClientId, // Required for iOS and Android
    offlineAccess: true, // If you want to access Google API on behalf of the user FROM YOUR SERVER
    scopes: ['email', 'profile'], // What API you want to access on behalf of the user
  });
}
