import React from 'react';
import { StatusBar, Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

type ErrorBoundaryComponentType = typeof import('./src/components/ErrorBoundary').ErrorBoundary;
type SyncStatusBannerComponentType = typeof import('./src/components/SyncStatusBanner').SyncStatusBanner;
type AppNavigatorComponentType = typeof import('./src/navigation/AppNavigator').AppNavigator;
type UseAuthInitializationHook = typeof import('./src/hooks/useAuthInitialization').useAuthInitialization;
type InitializeGoogleSignIn = typeof import('./src/utils/googleSignIn').initializeGoogleSignIn;

function loadModuleOrFallback<T>(label: string, loader: () => T, fallbackFactory: () => T): T {
  try {
    console.log(`[App/Bisect] Loading ${label}...`);
    const resolvedModule = loader();
    console.log(`[App/Bisect] ${label} loaded successfully`);
    return resolvedModule;
  } catch (error) {
    console.error(`[App/Bisect] ERROR: ${label} failed to load`, error);
    return fallbackFactory();
  }
}

const ErrorBoundaryComponent = loadModuleOrFallback<ErrorBoundaryComponentType>(
  'ErrorBoundary',
  () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('./src/components/ErrorBoundary').ErrorBoundary;
  },
  () => {
    class ErrorBoundaryFallback extends React.Component<React.PropsWithChildren> {
      componentDidMount() {
        console.warn('[App/Bisect] Using fallback ErrorBoundary - rendering children directly');
      }

      render() {
        return this.props.children ?? null;
      }
    }

    return ErrorBoundaryFallback as ErrorBoundaryComponentType;
  }
);

const SyncStatusBannerComponent = loadModuleOrFallback<SyncStatusBannerComponentType>(
  'SyncStatusBanner',
  () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('./src/components/SyncStatusBanner').SyncStatusBanner;
  },
  () => {
    const FallbackSyncStatusBanner: SyncStatusBannerComponentType = () => {
      console.warn('[App/Bisect] SyncStatusBanner failed to load - skipping banner render');
      return null;
    };
    return FallbackSyncStatusBanner;
  }
);

const AppNavigatorComponent = loadModuleOrFallback<AppNavigatorComponentType>(
  'AppNavigator',
  () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('./src/navigation/AppNavigator').AppNavigator;
  },
  () => {
    const FallbackAppNavigator: AppNavigatorComponentType = () => {
      console.warn('[App/Bisect] AppNavigator failed to load - rendering fallback view');
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ padding: 16, textAlign: 'center' }}>
            AppNavigator failed to load. Check console logs for module errors.
          </Text>
        </View>
      );
    };
    return FallbackAppNavigator;
  }
);

const useAuthInitializationHook = loadModuleOrFallback<UseAuthInitializationHook>(
  'useAuthInitialization hook',
  () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('./src/hooks/useAuthInitialization').useAuthInitialization;
  },
  () => {
    const noopHook: UseAuthInitializationHook = () => {
      console.warn('[App/Bisect] useAuthInitialization failed to load - skipping auth listener setup');
    };
    return noopHook;
  }
);

const initializeGoogleSignInFn = loadModuleOrFallback<InitializeGoogleSignIn>(
  'initializeGoogleSignIn utility',
  () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('./src/utils/googleSignIn').initializeGoogleSignIn;
  },
  () => {
    const noopInitializer: InitializeGoogleSignIn = () => {
      console.warn('[App/Bisect] initializeGoogleSignIn failed to load - skipping Google Sign-In setup');
    };
    return noopInitializer;
  }
);

console.log('[App] Module evaluation started');

function App() {
  console.log('[App] Component render start');
  const isDarkMode = useColorScheme() === 'dark';
  
  // Debug: confirm JS is executing
  React.useEffect(() => {
    console.log('=== App mounted, JS bundle loaded successfully ===');
    return () => {
      console.log('[App] App component unmounted');
    };
  }, []);
  
  React.useEffect(() => {
    console.log('[App] Starting Google Sign-In initialization...');
    try {
      initializeGoogleSignInFn();
      console.log('[App] Google Sign-In initialization completed');
    } catch (error) {
      console.error('[App] ERROR: Google Sign-In initialization failed:', error);
      // Don't throw - allow app to continue even if Google Sign-In fails
      // This prevents a silent crash that would cause a blank screen
    }
  }, []);

  // Initialize auth state listener
  console.log('[App] Invoking useAuthInitialization hook');
  useAuthInitializationHook();
  console.log('[App] useAuthInitialization hook invoked');

  console.log('[App] Rendering root component tree');

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ErrorBoundaryComponent 
        onError={(error, errorInfo) => {
          console.error('[App] ErrorBoundary caught error:', error);
          console.error('[App] Component stack:', errorInfo.componentStack);
        }}
      >
        {(() => {
          console.log('[App] About to render SyncStatusBanner');
          return <SyncStatusBannerComponent />;
        })()}
        {(() => {
          console.log('[App] About to render AppNavigator');
          return <AppNavigatorComponent />;
        })()}
      </ErrorBoundaryComponent>
    </SafeAreaProvider>
  );
}

export default App;
