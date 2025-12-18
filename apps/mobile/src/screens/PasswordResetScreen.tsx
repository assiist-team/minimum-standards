import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { firebaseAuth } from '../firebase/firebaseApp';
import { AuthStackParamList } from '../navigation/types';
import { passwordResetSchema, PasswordResetFormData } from '../schemas/authSchemas';
import { AuthError } from '../utils/errors';
import { logAuthErrorToCrashlytics } from '../utils/crashlytics';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export function PasswordResetScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: PasswordResetFormData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      await firebaseAuth.sendPasswordResetEmail(data.email);
      setSuccess(true);
      // Navigate back to sign in after a short delay
      setTimeout(() => {
        navigation.navigate('SignIn');
      }, 2000);
    } catch (err) {
      const authError = AuthError.fromFirebaseError(err);
      logAuthErrorToCrashlytics(authError, 'password_reset');
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background.screen }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>Enter your email to receive a reset link</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.background.card, shadowColor: theme.shadow }]}>
        {success && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              Password reset email sent! Check your inbox.
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!success && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.input.background,
                        borderColor: errors.email ? theme.input.borderError : theme.input.border,
                        color: theme.input.text,
                      },
                    ]}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.input.placeholder}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                )}
              />
              {errors.email && (
                <Text style={styles.fieldError}>{errors.email.message}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: theme.button.primary.background },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.button.primary.text} />
              ) : (
                <Text style={[styles.primaryButtonText, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.button.primary.text }]}>Send Reset Email</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={[styles.linkText, { color: theme.link }]}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 48,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  card: {
    borderRadius: 12,
    padding: 24,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  successContainer: {
    backgroundColor: '#efe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: '#060',
    fontSize: 14,
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
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  fieldError: {
    color: '#c00',
    fontSize: 12,
    marginTop: 4,
  },
  primaryButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
  },
});
