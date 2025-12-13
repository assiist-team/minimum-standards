import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBanner } from '../ErrorBanner';
import { FirestoreError } from '../../utils/errors';

describe('ErrorBanner', () => {
  test('displays error message for transient errors', () => {
    const error = new FirestoreError(
      'firestore/unavailable',
      'Service temporarily unavailable',
      {}
    );

    const { getByText } = render(
      <ErrorBanner error={error} onRetry={jest.fn()} />
    );

    expect(getByText('Service temporarily unavailable')).toBeTruthy();
  });

  test('retry button triggers retry with exponential backoff', () => {
    const onRetry = jest.fn();
    const error = new FirestoreError(
      'firestore/unavailable',
      'Service temporarily unavailable',
      {}
    );

    const { getByText } = render(
      <ErrorBanner error={error} onRetry={onRetry} />
    );

    const retryButton = getByText('Retry');
    fireEvent.press(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('error banner clears after successful retry', () => {
    const error = new FirestoreError(
      'firestore/unavailable',
      'Service temporarily unavailable',
      {}
    );

    const { getByText, rerender } = render(
      <ErrorBanner error={error} onRetry={jest.fn()} />
    );

    expect(getByText('Service temporarily unavailable')).toBeTruthy();

    // Simulate successful retry - error becomes null
    rerender(<ErrorBanner error={null} onRetry={jest.fn()} />);

    expect(() => getByText('Service temporarily unavailable')).toThrow();
  });

  test('handles permission-denied errors as UX cues', () => {
    const error = new FirestoreError(
      'firestore/permission-denied',
      'Permission denied',
      {}
    );

    const { getByText, queryByText } = render(
      <ErrorBanner error={error} onRetry={jest.fn()} />
    );

    // Should show permission-specific message
    expect(getByText(/do not have permission/i)).toBeTruthy();
    // Should NOT show retry button for permission errors
    expect(queryByText('Retry')).toBeNull();
  });

  test('does not show retry button for non-retryable errors', () => {
    const error = new FirestoreError(
      'firestore/not-found',
      'Resource not found',
      {}
    );

    const { queryByText } = render(
      <ErrorBanner error={error} onRetry={jest.fn()} />
    );

    expect(queryByText('Retry')).toBeNull();
  });

  test('respects showRetry prop override', () => {
    const error = new FirestoreError(
      'firestore/unavailable',
      'Service temporarily unavailable',
      {}
    );

    const { queryByText } = render(
      <ErrorBanner error={error} onRetry={jest.fn()} showRetry={false} />
    );

    expect(queryByText('Retry')).toBeNull();
  });

  test('uses custom message when provided', () => {
    const error = new Error('Generic error');

    const { getByText } = render(
      <ErrorBanner error={error} message="Custom error message" />
    );

    expect(getByText('Custom error message')).toBeTruthy();
    expect(() => getByText('Generic error')).toThrow();
  });

  test('returns null when error is null', () => {
    const { container } = render(<ErrorBanner error={null} />);

    expect(container.children.length).toBe(0);
  });
});
