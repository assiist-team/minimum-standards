import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { AuthError } from '../utils/errors';
import { logAuthErrorToCrashlytics } from '../utils/crashlytics';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';

export function SettingsScreen() {
  const theme = useTheme();
  const { signOut } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await signOut();
      // Navigation will be handled by AppNavigator based on auth state
    } catch (err) {
      const authError = AuthError.fromFirebaseError(err);
      logAuthErrorToCrashlytics(authError, 'sign_out');
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <View style={[styles.header, { backgroundColor: theme.background.secondary, borderBottomColor: theme.border.secondary }]}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.card, { backgroundColor: theme.background.card, shadowColor: theme.shadow }]}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.signOutButton,
            { backgroundColor: theme.button.destructive.background },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSignOut}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.button.destructive.text} />
          ) : (
            <Text style={[styles.signOutButtonText, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.button.destructive.text }]}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  card: {
    borderRadius: 12,
    padding: 24,
    margin: 24,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
  },
  signOutButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  signOutButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
