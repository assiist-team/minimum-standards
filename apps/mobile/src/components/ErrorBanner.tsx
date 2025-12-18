import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FirestoreError } from '../utils/errors';
import { useTheme } from '../theme/useTheme';

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
  const theme = useTheme();

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
      <View style={[styles.banner, { backgroundColor: theme.status.inProgress.background }]}>
        <Text style={[styles.errorText, { color: theme.archive.text }]}>
          You do not have permission to perform this action. Please sign in or contact support.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.banner, { backgroundColor: theme.archive.badgeBackground }]}>
      <Text style={[styles.errorText, { color: theme.archive.badgeText }]}>
        {displayMessage}
      </Text>
      {shouldShowRetry && (
        <TouchableOpacity
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Text style={[styles.retryText, { color: theme.link }]}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: 12,
    margin: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    marginRight: 12,
    fontSize: 14,
  },
  retryText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
