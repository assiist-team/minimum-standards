import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { FirestoreError } from '../utils/errors';

export interface ErrorBannerProps {
  /** The error to display */
  error: Error | FirestoreError | null;
  /** Callback when retry button is pressed */
  onRetry?: () => void;
  /** Optional custom message override */
  message?: string;
  /** Whether to show retry button (default: true for retryable errors) */
  showRetry?: boolean;
}

/**
 * Reusable error banner component that displays errors consistently
 * across all screens with optional retry functionality.
 */
export function ErrorBanner({
  error,
  onRetry,
  message,
  showRetry,
}: ErrorBannerProps) {
  const isDark = useColorScheme() === 'dark';

  if (!error) {
    return null;
  }

  // Determine if error is retryable
  const isRetryable = error instanceof FirestoreError && error.isRetryable();
  const shouldShowRetry = showRetry !== false && isRetryable && onRetry;

  // Get user-friendly message
  const displayMessage = message || error.message || 'Something went wrong';

  // Handle permission errors as UX cues
  if (error instanceof FirestoreError && error.isPermissionError()) {
    return (
      <View style={[styles.banner, styles.permissionBanner, isDark && styles.bannerDark]}>
        <Text style={[styles.errorText, isDark && styles.errorTextDark]}>
          You do not have permission to perform this action. Please sign in or contact support.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.banner, isDark && styles.bannerDark]}>
      <Text style={[styles.errorText, isDark && styles.errorTextDark]}>
        {displayMessage}
      </Text>
      {shouldShowRetry && (
        <TouchableOpacity
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Text style={[styles.retryText, isDark && styles.retryTextDark]}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FDECEA',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerDark: {
    backgroundColor: '#3E1E1E',
  },
  permissionBanner: {
    backgroundColor: '#FFF8E1',
  },
  errorText: {
    color: '#9B1C1C',
    flex: 1,
    marginRight: 12,
    fontSize: 14,
  },
  errorTextDark: {
    color: '#EF5350',
  },
  retryText: {
    color: '#0F62FE',
    fontWeight: '600',
    fontSize: 14,
  },
  retryTextDark: {
    color: '#64B5F6',
  },
});
