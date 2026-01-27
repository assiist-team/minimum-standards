import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Config from 'react-native-config';
import { Platform } from 'react-native';
import { googleSignInWebClientId } from '../config/googleSignIn';

/**
 * Initializes Google Sign-In with Firebase configuration.
 * Call this once during app startup (e.g., in App.tsx).
 * 
 * Note: Configure the Android webClientId in your .env file.
 * Get it from Firebase Console > Authentication > Sign-in method > Google > Web client ID
 */
export function initializeGoogleSignIn() {
  console.log('[Google Sign-In] Initializing Google Sign-In...');
  const webClientId = Config.GOOGLE_SIGN_IN_WEB_CLIENT_ID || googleSignInWebClientId;
  const iosClientId =
    Config.GOOGLE_SIGN_IN_IOS_CLIENT_ID ||
    '1055581806274-1n5keauch2qufmqirdcnvrdl8221q6m6.apps.googleusercontent.com';

  // `webClientId` is required on Android to obtain an ID token for Firebase auth.
  // On iOS, providing an incorrect web client id often causes `invalid_audience` during token exchange.
  if (Platform.OS === 'android' && !webClientId) {
    console.error(
      '[Google Sign-In] ERROR: webClientId not configured. ' +
      'Set GOOGLE_SIGN_IN_WEB_CLIENT_ID in your .env file. ' +
      'See .env.example for reference.'
    );
    return;
  }

  const redactedWebClientId = webClientId ? `${webClientId.substring(0, 20)}...` : '(not set)';
  console.log('[Google Sign-In] Configuring Google Sign-In', {
    platform: Platform.OS,
    hasWebClientId: !!webClientId,
    webClientId: redactedWebClientId,
    hasIosClientId: !!iosClientId,
  });
  try {
    GoogleSignin.configure({
      ...(Platform.OS === 'android' ? { webClientId } : {}),
      ...(Platform.OS === 'ios' ? { iosClientId } : {}),
      offlineAccess: false, // Set to false to reduce permission prompts if server-side access isn't needed
      scopes: ['email', 'profile'], // What API you want to access on behalf of the user
    });
    console.log('[Google Sign-In] Google Sign-In configured successfully');
  } catch (error) {
    console.error('[Google Sign-In] Error configuring Google Sign-In:', error);
  }
}
