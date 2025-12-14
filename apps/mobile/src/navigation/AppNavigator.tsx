import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';
import { LoadingScreen } from '../components/LoadingScreen';
import { useAuthStore } from '../stores/authStore';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { user, isInitialized } = useAuthStore();

  // Show loading screen while auth state initializes
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <RootStack.Screen name="Main" component={MainStack} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthStack} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
