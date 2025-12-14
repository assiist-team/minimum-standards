import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SignUpScreen } from '../SignUpScreen';
import auth from '@react-native-firebase/auth';
import { logAuthErrorToCrashlytics } from '../../utils/crashlytics';

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
  })),
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

describe('SignUpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('validates password confirmation match', async () => {
    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const passwordConfirmationInput = getByPlaceholderText('Confirm your password');
    const submitButton = getByText('Sign Up');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(passwordConfirmationInput, 'different');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('Passwords do not match')).toBeTruthy();
    });
  });

  test('logs auth error to Crashlytics when sign up fails', async () => {
    const mockAuth = auth as jest.MockedFunction<typeof auth>;
    const mockCreateUser = jest.fn(() => 
      Promise.reject({ code: 'auth/email-already-in-use', message: 'Email already in use' })
    );
    mockAuth.mockReturnValue({
      createUserWithEmailAndPassword: mockCreateUser,
    } as any);

    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const passwordConfirmationInput = getByPlaceholderText('Confirm your password');
    const submitButton = getByText('Sign Up');

    fireEvent.changeText(emailInput, 'existing@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(passwordConfirmationInput, 'password123');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockLogAuthErrorToCrashlytics).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'auth/email-already-in-use' }),
        'sign_up'
      );
    });
  });
});
