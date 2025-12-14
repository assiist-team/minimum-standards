import auth from '@react-native-firebase/auth';
import { AuthError } from './errors';

/**
 * Lazily gets the Crashlytics instance.
 * Returns null if Crashlytics is not available.
 */
function getCrashlytics() {
  try {
    // Lazy import - only require when actually needed
    const crashlyticsModule = require('@react-native-firebase/crashlytics');
    return crashlyticsModule.default();
  } catch {
    // Crashlytics not installed, return null
    return null;
  }
}

/**
 * Logs auth errors to Crashlytics with user context if available.
 * Fails silently if Crashlytics is not available.
 */
export function logAuthErrorToCrashlytics(error: AuthError, context?: string) {
  const crashlytics = getCrashlytics();
  if (!crashlytics) {
    // Crashlytics not available, skip logging
    return;
  }

  try {
    // Set user identifier if authenticated
    const user = auth().currentUser;
    if (user?.uid) {
      crashlytics.setUserId(user.uid);
    }

    // Log structured error information
    const logMessage = context
      ? `Auth error [${context}]: ${error.code}`
      : `Auth error: ${error.code}`;
    crashlytics.log(logMessage);
    crashlytics.setAttribute('error_code', error.code);
    crashlytics.setAttribute('error_type', 'auth');
    
    if (context) {
      crashlytics.setAttribute('error_context', context);
    }

    // Record the error (non-fatal)
    crashlytics.recordError(error);
  } catch (crashlyticsError) {
    // Fail silently if Crashlytics logging fails
    console.warn('Failed to log auth error to Crashlytics:', crashlyticsError);
  }
}
