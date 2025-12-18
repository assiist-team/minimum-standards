import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../stores/authStore';
import { AuthError } from '../utils/errors';
import { logAuthErrorToCrashlytics } from '../utils/crashlytics';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';

export function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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
    <View style={[styles.container, { backgroundColor: theme.background.screen }]}>
      <View style={[styles.header, { backgroundColor: theme.background.chrome, borderBottomColor: theme.border.secondary, paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Settings</Text>
        <TouchableOpacity
          style={styles.signOutIconContainer}
          onPress={handleSignOut}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.button.primary.background} />
          ) : (
            <MaterialIcons name="logout" size={24} color={theme.button.primary.background} />
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: theme.background.card, shadowColor: theme.shadow }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  signOutIconContainer: {
    width: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 4,
  },
  errorContainer: {
    borderRadius: 12,
    padding: 24,
    margin: 24,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
  },
});
