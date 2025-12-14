import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SignInScreen } from '../SignInScreen';
import auth from '@react-native-firebase/auth';
import { logAuthErrorToCrashlytics } from '../../utils/crashlytics';

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    GoogleAuthProvider: {
      credential: jest.fn(),
    },
  })),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn(() => Promise.resolve()),
    signIn: jest.fn(() => Promise.resolve({ idToken: 'token', accessToken: 'access' })),
  },
}));

jest.mock('../../utils/crashlytics', () => ({
  logAuthErrorToCrashlytics: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  };
});

const mockLogAuthErrorToCrashlytics = logAuthErrorToCrashlytics as jest.MockedFunction<typeof logAuthErrorToCrashlytics>;

describe('SignInScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders email/password fields and Google button', () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);

    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(getByText('Sign in with Google')).toBeTruthy();
  });

  test('logs auth error to Crashlytics when email/password sign in fails', async () => {
    const mockAuth = auth as jest.MockedFunction<typeof auth>;
    const mockSignInWithEmailAndPassword = jest.fn(() => 
      Promise.reject({ code: 'auth/invalid-credential', message: 'Invalid credential' })
    );
    mockAuth.mockReturnValue({
      signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
    } as any);

    const { getByPlaceholderText, getByText } = render(<SignInScreen />);

    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const submitButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockLogAuthErrorToCrashlytics).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'auth/invalid-credential' }),
        'sign_in'
      );
    });
  });

  test('logs auth error to Crashlytics when Google sign in fails', async () => {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    GoogleSignin.signIn.mockRejectedValueOnce({ 
      code: 'auth/network-request-failed', 
      message: 'Network error' 
    });

    const { getByText } = render(<SignInScreen />);

    const googleButton = getByText('Sign in with Google');
    fireEvent.press(googleButton);

    await waitFor(() => {
      expect(mockLogAuthErrorToCrashlytics).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'auth/network-request-failed' }),
        'google_sign_in'
      );
    });
  });
});
