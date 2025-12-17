import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { normalizeFirebaseError } from '../utils/errors';
import { firebaseAuth } from '../firebase/firebaseApp';

// Conditionally import Crashlytics if available
let crashlytics: any = null;
try {
  crashlytics = require('@react-native-firebase/crashlytics').default();
} catch {
  // Crashlytics not installed, will skip logging
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary component that catches unhandled exceptions
 * and logs fatal errors to Crashlytics.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to Crashlytics if available
    this.logToCrashlytics(error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logToCrashlytics(error: Error, errorInfo: ErrorInfo) {
    if (!crashlytics) {
      // Crashlytics not available, skip logging
      return;
    }

    try {
      // Set user identifier if authenticated
      const user = firebaseAuth.currentUser;
      if (user?.uid) {
        crashlytics().setUserId(user.uid);
      }

      // Normalize error to get stable code
      const normalizedError = normalizeFirebaseError(error);
      
      // Log structured error information
      crashlytics().log(`Error Boundary caught: ${normalizedError.code}`);
      crashlytics().setAttribute('error_code', normalizedError.code);
      crashlytics().setAttribute('error_name', error.name);
      
      if (errorInfo.componentStack) {
        crashlytics().setAttribute('component_stack', errorInfo.componentStack.substring(0, 500));
      }

      // Record the fatal error
      crashlytics().recordError(error);
    } catch (crashlyticsError) {
      // Fail silently if Crashlytics logging fails
      console.warn('Failed to log to Crashlytics:', crashlyticsError);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const isDark = useColorScheme() === 'dark';
  const normalizedError = error ? normalizeFirebaseError(error) : null;
  const userMessage = normalizedError?.message || 'Something went wrong. Please try again.';

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.content, isDark && styles.contentDark]}>
        <Text style={[styles.title, isDark && styles.titleDark]}>Something went wrong</Text>
        <Text style={[styles.message, isDark && styles.messageDark]}>
          {userMessage}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, isDark && styles.retryButtonDark]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  containerDark: {
    backgroundColor: '#1E1E1E',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  contentDark: {
    backgroundColor: '#2E2E2E',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
    textAlign: 'center',
  },
  titleDark: {
    color: '#E0E0E0',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  messageDark: {
    color: '#B0B0B0',
  },
  retryButton: {
    backgroundColor: '#0F62FE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonDark: {
    backgroundColor: '#4DBAF7',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
