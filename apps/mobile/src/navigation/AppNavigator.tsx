import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';
import { LoadingScreen } from '../components/LoadingScreen';
import { useAuthStore } from '../stores/authStore';

const RootStack = createNativeStackNavigator<RootStackParamList>();

console.log('[AppNavigator] Module evaluation started');

export function AppNavigator() {
  const { user, isInitialized } = useAuthStore();
  console.log('[AppNavigator] Render start', {
    isInitialized,
    hasUser: !!user,
    userId: user?.uid,
  });

  // Show loading screen while auth state initializes
  if (!isInitialized) {
    console.log('[AppNavigator] Auth not initialized yet - rendering LoadingScreen');
    return <LoadingScreen />;
  }

  const destination = user ? 'MainStack' : 'AuthStack';
  console.log('[AppNavigator] Auth initialized - rendering', destination);

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
