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
  console.log('[Google Sign-In] Initializing Google Sign-In...');
  const webClientId = Config.GOOGLE_SIGN_IN_WEB_CLIENT_ID;

  if (!webClientId) {
    console.error(
      '[Google Sign-In] ERROR: webClientId not configured. ' +
      'Set GOOGLE_SIGN_IN_WEB_CLIENT_ID in your .env file. ' +
      'See .env.example for reference.'
    );
    return;
  }

  console.log('[Google Sign-In] Configuring Google Sign-In with webClientId:', webClientId.substring(0, 20) + '...');
  try {
    GoogleSignin.configure({
      webClientId, // Required for Firebase authentication
      iosClientId: '1055581806274-1n5keauch2qufmqirdcnvrdl8221q6m6.apps.googleusercontent.com', // iOS OAuth client ID
      offlineAccess: false, // Set to false to reduce permission prompts if server-side access isn't needed
      scopes: ['email', 'profile'], // What API you want to access on behalf of the user
    });
    console.log('[Google Sign-In] Google Sign-In configured successfully');
  } catch (error) {
    console.error('[Google Sign-In] Error configuring Google Sign-In:', error);
  }
}
