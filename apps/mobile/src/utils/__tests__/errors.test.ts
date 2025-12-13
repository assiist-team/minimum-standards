import { AuthError, FirestoreError, normalizeFirebaseError } from '../errors';

describe('Normalized Error Classes', () => {
  describe('AuthError', () => {
    test('wraps Firebase Auth errors with stable code', () => {
      const firebaseError = {
        code: 'auth/user-not-found',
        message: 'There is no user record corresponding to this identifier.',
      };

      const authError = AuthError.fromFirebaseError(firebaseError);

      expect(authError).toBeInstanceOf(AuthError);
      expect(authError.code).toBe('auth/user-not-found');
      expect(authError.message).toBe('No account found with this email.');
      expect(authError.originalError).toBe(firebaseError);
    });

    test('includes user-friendly message property', () => {
      const firebaseError = {
        code: 'auth/wrong-password',
        message: 'The password is invalid or the user does not have a password.',
      };

      const authError = AuthError.fromFirebaseError(firebaseError);

      expect(authError.message).toBe('Incorrect password.');
      expect(authError.message).not.toContain('auth/wrong-password');
    });

    test('handles unknown auth error codes', () => {
      const firebaseError = {
        code: 'auth/unknown-code',
        message: 'Some unknown error',
      };

      const authError = AuthError.fromFirebaseError(firebaseError);

      expect(authError.code).toBe('auth/unknown-code');
      expect(authError.message).toBe('An authentication error occurred. Please try again.');
    });

    test('handles errors without code', () => {
      const firebaseError = {
        message: 'Some error',
      };

      const authError = AuthError.fromFirebaseError(firebaseError);

      expect(authError.code).toBe('auth/unknown-error');
      expect(authError.message).toBe('An authentication error occurred. Please try again.');
    });

    test('returns same instance if already AuthError', () => {
      const authError = new AuthError('auth/test', 'Test message', {});
      const result = AuthError.fromFirebaseError(authError);

      expect(result).toBe(authError);
    });
  });

  describe('FirestoreError', () => {
    test('wraps Firestore errors with stable code', () => {
      const firestoreError = {
        code: 'firestore/permission-denied',
        message: 'Missing or insufficient permissions.',
      };

      const error = FirestoreError.fromFirebaseError(firestoreError);

      expect(error).toBeInstanceOf(FirestoreError);
      expect(error.code).toBe('firestore/permission-denied');
      expect(error.message).toBe('You do not have permission to perform this action.');
      expect(error.originalError).toBe(firestoreError);
    });

    test('includes user-friendly message property', () => {
      const firestoreError = {
        code: 'firestore/unavailable',
        message: 'The service is currently unavailable.',
      };

      const error = FirestoreError.fromFirebaseError(firestoreError);

      expect(error.message).toBe('Service temporarily unavailable. Please try again.');
      expect(error.message).not.toContain('firestore/unavailable');
    });

    test('identifies retryable errors', () => {
      const retryableCodes = [
        'firestore/unavailable',
        'firestore/deadline-exceeded',
        'firestore/resource-exhausted',
        'firestore/aborted',
        'firestore/internal',
      ];

      retryableCodes.forEach((code) => {
        const error = new FirestoreError(code, 'Test', {});
        expect(error.isRetryable()).toBe(true);
      });
    });

    test('identifies non-retryable errors', () => {
      const nonRetryableCodes = [
        'firestore/permission-denied',
        'firestore/not-found',
        'firestore/already-exists',
      ];

      nonRetryableCodes.forEach((code) => {
        const error = new FirestoreError(code, 'Test', {});
        expect(error.isRetryable()).toBe(false);
      });
    });

    test('identifies permission errors', () => {
      const permissionError = new FirestoreError(
        'firestore/permission-denied',
        'Permission denied',
        {}
      );

      expect(permissionError.isPermissionError()).toBe(true);
    });

    test('handles unknown firestore error codes', () => {
      const firestoreError = {
        code: 'firestore/unknown-code',
        message: 'Some unknown error',
      };

      const error = FirestoreError.fromFirebaseError(firestoreError);

      expect(error.code).toBe('firestore/unknown-code');
      expect(error.message).toBe('A database error occurred. Please try again.');
    });

    test('returns same instance if already FirestoreError', () => {
      const firestoreError = new FirestoreError('firestore/test', 'Test message', {});
      const result = FirestoreError.fromFirebaseError(firestoreError);

      expect(result).toBe(firestoreError);
    });
  });

  describe('normalizeFirebaseError', () => {
    test('maps Firebase error codes to user-friendly messages', () => {
      const authError = {
        code: 'auth/email-already-in-use',
        message: 'The email address is already in use.',
      };

      const normalized = normalizeFirebaseError(authError);

      expect(normalized).toBeInstanceOf(AuthError);
      expect(normalized.code).toBe('auth/email-already-in-use');
      expect(normalized.message).toBe('This email is already registered.');
    });

    test('determines error type from code prefix', () => {
      const authError = { code: 'auth/user-not-found' };
      const firestoreError = { code: 'firestore/permission-denied' };

      const normalizedAuth = normalizeFirebaseError(authError);
      const normalizedFirestore = normalizeFirebaseError(firestoreError);

      expect(normalizedAuth).toBeInstanceOf(AuthError);
      expect(normalizedFirestore).toBeInstanceOf(FirestoreError);
    });

    test('defaults to FirestoreError for unknown error types', () => {
      const unknownError = {
        code: 'unknown/error',
        message: 'Some error',
      };

      const normalized = normalizeFirebaseError(unknownError);

      expect(normalized).toBeInstanceOf(FirestoreError);
    });

    test('handles errors without code by checking message', () => {
      const authLikeError = {
        message: 'Auth error occurred',
      };

      const normalized = normalizeFirebaseError(authLikeError);

      // Should default to AuthError if message contains "auth"
      expect(normalized).toBeInstanceOf(AuthError);
    });
  });
});
