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
import auth from '@react-native-firebase/auth';
import { AuthStackParamList } from '../navigation/types';
import { signUpSchema, SignUpFormData } from '../schemas/authSchemas';
import { AuthError } from '../utils/errors';
import { logAuthErrorToCrashlytics } from '../utils/crashlytics';
import { useTheme } from '../theme/useTheme';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export function SignUpScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirmation: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setLoading(true);
      setError(null);
      await auth().createUserWithEmailAndPassword(data.email, data.password);
      // User is automatically signed in, navigation handled by AppNavigator
    } catch (err) {
      const authError = AuthError.fromFirebaseError(err);
      logAuthErrorToCrashlytics(authError, 'sign_up');
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background.primary }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Sign Up</Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>Create your account</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.background.card, shadowColor: theme.shadow }]}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

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

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.input.background,
                    borderColor: errors.password ? theme.input.borderError : theme.input.border,
                    color: theme.input.text,
                  },
                ]}
                placeholder="Enter your password"
                placeholderTextColor={theme.input.placeholder}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                autoComplete="password-new"
              />
            )}
          />
          {errors.password && (
            <Text style={styles.fieldError}>{errors.password.message}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm Password</Text>
          <Controller
            control={control}
            name="passwordConfirmation"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.input.background,
                    borderColor: errors.passwordConfirmation ? theme.input.borderError : theme.input.border,
                    color: theme.input.text,
                  },
                ]}
                placeholder="Confirm your password"
                placeholderTextColor={theme.input.placeholder}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                autoComplete="password-new"
              />
            )}
          />
          {errors.passwordConfirmation && (
            <Text style={styles.fieldError}>{errors.passwordConfirmation.message}</Text>
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
            <Text style={[styles.primaryButtonText, { color: theme.button.primary.text }]}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.text.secondary }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={[styles.footerLink, { color: theme.link }]}>Sign in</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
