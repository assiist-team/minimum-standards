import { firebaseAuth } from '../firebase/firebaseApp';
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

function sanitizeCrashlyticsAttributeValue(value: string): string {
  const emailRedacted = value.replace(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    '[redacted email]'
  );
  return emailRedacted.length > 500 ? `${emailRedacted.slice(0, 500)}…` : emailRedacted;
}

function extractRawAuthErrorFields(error: AuthError): { rawCode?: string; rawMessage?: string } {
  const original = (error as unknown as { originalError?: unknown }).originalError as any;
  const rawCode = original?.code !== undefined ? String(original.code) : undefined;
  const rawMessage = typeof original?.message === 'string' ? original.message : undefined;
  return {
    rawCode: rawCode ? sanitizeCrashlyticsAttributeValue(rawCode) : undefined,
    rawMessage: rawMessage ? sanitizeCrashlyticsAttributeValue(rawMessage) : undefined,
  };
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
    const user = firebaseAuth.currentUser;
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

    const { rawCode, rawMessage } = extractRawAuthErrorFields(error);
    if (rawCode) {
      crashlytics.setAttribute('raw_error_code', rawCode);
    }
    if (rawMessage) {
      crashlytics.setAttribute('raw_error_message', rawMessage);
    }

    // Record the error (non-fatal)
    crashlytics.recordError(error);
  } catch (crashlyticsError) {
    // Fail silently if Crashlytics logging fails
    console.warn('Failed to log auth error to Crashlytics:', crashlyticsError);
  }
}
