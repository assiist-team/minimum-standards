import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { SignInScreen } from '../screens/SignInScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { PasswordResetScreen } from '../screens/PasswordResetScreen';
import { useTheme } from '../theme/useTheme';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  const theme = useTheme();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background.screen } }}>
      <Stack.Screen 
        name="SignIn" 
        component={SignInScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="SignUp" 
        component={SignUpScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PasswordReset" 
        component={PasswordResetScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Add testID for testing purposes
AuthStack.displayName = 'AuthStack';
