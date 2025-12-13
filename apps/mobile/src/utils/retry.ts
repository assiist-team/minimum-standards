/**
 * Retry utility with exponential backoff for idempotent operations.
 * Only retries transient errors (network, Firestore timeouts).
 */

import { FirestoreError } from './errors';

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Calculates the delay for a given attempt using exponential backoff.
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelayMs);
}

/**
 * Sleeps for the specified number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an idempotent operation with exponential backoff.
 * Only retries on transient Firestore errors (unavailable, deadline-exceeded, etc.).
 * 
 * @param operation - The async operation to retry
 * @param options - Retry configuration options
 * @returns The result of the operation
 * @throws The last error if all retries are exhausted
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Only retry if it's a retryable Firestore error
      if (error instanceof FirestoreError && error.isRetryable()) {
        // Don't retry on the last attempt
        if (attempt < config.maxAttempts - 1) {
          const delay = calculateDelay(attempt, config);
          await sleep(delay);
          continue;
        }
      }

      // If not retryable or max attempts reached, throw the error
      throw error;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Retries an idempotent Firestore read operation.
 */
export async function retryFirestoreRead<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return retryWithBackoff(operation, options);
}

/**
 * Retries an idempotent Firestore write operation.
 * Use with caution - only for truly idempotent writes.
 */
export async function retryFirestoreWrite<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return retryWithBackoff(operation, options);
}
