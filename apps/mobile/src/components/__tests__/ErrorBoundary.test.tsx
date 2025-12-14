import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock Firebase Auth
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    currentUser: { uid: 'test-user-123' },
  })),
}));

// Mock Crashlytics (optional dependency)
const mockCrashlytics = {
  setUserId: jest.fn(),
  log: jest.fn(),
  setAttribute: jest.fn(),
  recordError: jest.fn(),
};

jest.mock('@react-native-firebase/crashlytics', () => {
  try {
    return {
      __esModule: true,
      default: jest.fn(() => mockCrashlytics),
    };
  } catch {
    return null;
  }
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('catches unhandled exceptions', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText(/Something went wrong. Please try again/i)).toBeTruthy();
  });

  test('Crashlytics logging includes Firebase auth UID', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Verify Crashlytics was called with user ID
    expect(mockCrashlytics.setUserId).toHaveBeenCalledWith('test-user-123');
    expect(mockCrashlytics.recordError).toHaveBeenCalled();
  });

  test('displays user-friendly error message', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Should show user-friendly message, not raw error
    expect(getByText(/Something went wrong/i)).toBeTruthy();
    // Should NOT show raw error message
    expect(() => getByText('Test error')).toThrow();
  });

  test('retry button resets error state', () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <React.Fragment>Success</React.Fragment>;
    };

    const { getByText, rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();

    const retryButton = getByText('Retry');
    fireEvent.press(retryButton);

    // After retry, error boundary should reset
    // In a real scenario, the component would re-render without error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByText('Success')).toBeTruthy();
  });

  test('uses custom fallback if provided', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const customFallback = <React.Fragment>Custom Error UI</React.Fragment>;

    const { getByText } = render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText('Custom Error UI')).toBeTruthy();
    expect(() => getByText('Something went wrong')).toThrow();
  });

  test('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][1]).toHaveProperty('componentStack');
  });
});
