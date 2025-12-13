import { retryWithBackoff } from '../retry';
import { FirestoreError } from '../errors';

describe('Retry Logic with Exponential Backoff', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('exponential backoff delays increase correctly', async () => {
    const operation = jest.fn().mockRejectedValue(
      new FirestoreError('firestore/unavailable', 'Service unavailable', {})
    );

    const retryPromise = retryWithBackoff(operation, {
      maxAttempts: 3,
      initialDelayMs: 100,
      backoffMultiplier: 2,
    });

    // First attempt fails immediately
    await jest.advanceTimersByTimeAsync(0);
    expect(operation).toHaveBeenCalledTimes(1);

    // Wait for first retry delay (100ms)
    await jest.advanceTimersByTimeAsync(100);
    expect(operation).toHaveBeenCalledTimes(2);

    // Wait for second retry delay (200ms)
    await jest.advanceTimersByTimeAsync(200);
    expect(operation).toHaveBeenCalledTimes(3);

    // Operation should fail after max attempts
    await expect(retryPromise).rejects.toThrow();
  });

  test('retry works for idempotent Firestore operations', async () => {
    let attemptCount = 0;
    const operation = jest.fn().mockImplementation(async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new FirestoreError('firestore/unavailable', 'Service unavailable', {});
      }
      return 'success';
    });

    const retryPromise = retryWithBackoff(operation, {
      maxAttempts: 3,
      initialDelayMs: 10,
    });

    // Advance timers through retries
    await jest.advanceTimersByTimeAsync(0); // First attempt
    await jest.advanceTimersByTimeAsync(10); // First retry
    await jest.advanceTimersByTimeAsync(20); // Second retry

    const result = await retryPromise;
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  test('retry fails gracefully after max attempts', async () => {
    const operation = jest.fn().mockRejectedValue(
      new FirestoreError('firestore/unavailable', 'Service unavailable', {})
    );

    const retryPromise = retryWithBackoff(operation, {
      maxAttempts: 2,
      initialDelayMs: 10,
    });

    // Advance through all attempts
    await jest.advanceTimersByTimeAsync(0); // First attempt
    await jest.advanceTimersByTimeAsync(10); // First retry

    await expect(retryPromise).rejects.toThrow(FirestoreError);
    expect(operation).toHaveBeenCalledTimes(2);
  });

  test('does not retry non-retryable errors', async () => {
    const operation = jest.fn().mockRejectedValue(
      new FirestoreError('firestore/permission-denied', 'Permission denied', {})
    );

    const retryPromise = retryWithBackoff(operation, {
      maxAttempts: 3,
      initialDelayMs: 10,
    });

    await jest.advanceTimersByTimeAsync(0);

    await expect(retryPromise).rejects.toThrow(FirestoreError);
    expect(operation).toHaveBeenCalledTimes(1); // Should not retry
  });

  test('respects max delay cap', async () => {
    const operation = jest.fn().mockRejectedValue(
      new FirestoreError('firestore/unavailable', 'Service unavailable', {})
    );

    const retryPromise = retryWithBackoff(operation, {
      maxAttempts: 5,
      initialDelayMs: 1000,
      maxDelayMs: 2000,
      backoffMultiplier: 2,
    });

    // First attempt
    await jest.advanceTimersByTimeAsync(0);
    expect(operation).toHaveBeenCalledTimes(1);

    // First retry: 1000ms (capped at 2000ms)
    await jest.advanceTimersByTimeAsync(1000);
    expect(operation).toHaveBeenCalledTimes(2);

    // Second retry: 2000ms (capped)
    await jest.advanceTimersByTimeAsync(2000);
    expect(operation).toHaveBeenCalledTimes(3);

    // Third retry: still 2000ms (capped)
    await jest.advanceTimersByTimeAsync(2000);
    expect(operation).toHaveBeenCalledTimes(4);

    await expect(retryPromise).rejects.toThrow();
  });

  test('succeeds immediately if operation succeeds on first attempt', async () => {
    const operation = jest.fn().mockResolvedValue('success');

    const result = await retryWithBackoff(operation);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  test('does not retry non-Firestore errors', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Generic error'));

    const retryPromise = retryWithBackoff(operation, {
      maxAttempts: 3,
      initialDelayMs: 10,
    });

    await jest.advanceTimersByTimeAsync(0);

    await expect(retryPromise).rejects.toThrow('Generic error');
    expect(operation).toHaveBeenCalledTimes(1); // Should not retry
  });
});
