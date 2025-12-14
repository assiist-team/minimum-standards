import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PasswordResetScreen } from '../PasswordResetScreen';
import auth from '@react-native-firebase/auth';
import { logAuthErrorToCrashlytics } from '../../utils/crashlytics';

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
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

describe('PasswordResetScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows success message after email sent', async () => {
    const { getByPlaceholderText, getByText } = render(<PasswordResetScreen />);

    const emailInput = getByPlaceholderText('Enter your email');
    const submitButton = getByText('Send Reset Email');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('Password reset email sent! Check your inbox.')).toBeTruthy();
    });
  });

  test('logs auth error to Crashlytics when password reset fails', async () => {
    const mockAuth = auth as jest.MockedFunction<typeof auth>;
    const mockSendPasswordResetEmail = jest.fn(() => 
      Promise.reject({ code: 'auth/user-not-found', message: 'User not found' })
    );
    mockAuth.mockReturnValue({
      sendPasswordResetEmail: mockSendPasswordResetEmail,
    } as any);

    const { getByPlaceholderText, getByText } = render(<PasswordResetScreen />);

    const emailInput = getByPlaceholderText('Enter your email');
    const submitButton = getByText('Send Reset Email');

    fireEvent.changeText(emailInput, 'nonexistent@example.com');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockLogAuthErrorToCrashlytics).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'auth/user-not-found' }),
        'password_reset'
      );
    });
  });
});
