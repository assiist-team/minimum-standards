import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { SyncStatusBanner } from './src/components/SyncStatusBanner';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthInitialization } from './src/hooks/useAuthInitialization';
import { initializeGoogleSignIn } from './src/utils/googleSignIn';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  
  // Initialize Google Sign-In configuration
  React.useEffect(() => {
    initializeGoogleSignIn();
  }, []);

  // Initialize auth state listener
  useAuthInitialization();

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ErrorBoundary>
        <SyncStatusBanner />
        <AppNavigator />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default App;
