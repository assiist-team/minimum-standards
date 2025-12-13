import React, { useMemo, useState, useCallback } from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ActiveStandardsDashboardScreen } from './src/screens/ActiveStandardsDashboardScreen';
import { ActivityLibraryScreen } from './src/screens/ActivityLibraryScreen';
import { StandardsBuilderScreen } from './src/screens/StandardsBuilderScreen';
import { StandardsLibraryScreen } from './src/screens/StandardsLibraryScreen';
import { ArchivedStandardsScreen } from './src/screens/ArchivedStandardsScreen';
import { LogEntryModal } from './src/components/LogEntryModal';
import { useStandards } from './src/hooks/useStandards';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { SyncStatusBanner } from './src/components/SyncStatusBanner';

type RootView = 'home' | 'library' | 'builder' | 'archived' | 'dashboard' | 'standardsLibrary';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [view, setView] = useState<RootView>('home');

  const content = useMemo(() => {
    switch (view) {
      case 'library':
        return (
          <ActivityLibraryScreen
            onClose={() => setView('home')}
          />
        );
      case 'builder':
        return <StandardsBuilderScreen onBack={() => setView('home')} />;
      case 'archived':
        return <ArchivedStandardsScreen onBack={() => setView('home')} />;
      case 'dashboard':
        return (
          <ActiveStandardsDashboardScreen
            onBack={() => setView('home')}
            onLaunchBuilder={() => setView('builder')}
          />
        );
      case 'standardsLibrary':
        return <StandardsLibraryScreen onBack={() => setView('home')} />;
      default:
        return <HomeScreen onNavigate={setView} />;
    }
  }, [view]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safeArea}>
        <ErrorBoundary>
          <SyncStatusBanner />
          {content}
        </ErrorBoundary>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function HomeScreen({ onNavigate }: { onNavigate: (next: RootView) => void }) {
  const [logModalVisible, setLogModalVisible] = useState(false);
  const { createLogEntry } = useStandards();

  const handleLogSave = useCallback(
    async (standardId: string, value: number, occurredAtMs: number, note?: string | null) => {
      await createLogEntry({ standardId, value, occurredAtMs, note });
    },
    [createLogEntry]
  );

  const handleLogModalClose = useCallback(() => {
    setLogModalVisible(false);
  }, []);

  return (
    <View style={styles.homeContainer}>
      <Text style={styles.appTitle}>Minimum Standards</Text>
      <Text style={styles.homeSubtitle}>
        Choose a workflow to get started.
      </Text>
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => setLogModalVisible(true)}
        accessibilityLabel="Log Activity"
        accessibilityRole="button"
      >
        <Text style={styles.homeButtonText}>Log Activity</Text>
        <Text style={styles.homeButtonHint}>
          Quickly log progress for any active standard.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => onNavigate('library')}
      >
        <Text style={styles.homeButtonText}>Activity Library</Text>
        <Text style={styles.homeButtonHint}>
          Manage and reuse activities.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => onNavigate('builder')}
      >
        <Text style={styles.homeButtonText}>Standards Builder</Text>
        <Text style={styles.homeButtonHint}>
          Select activities from the builder flow.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => onNavigate('standardsLibrary')}
      >
        <Text style={styles.homeButtonText}>Standards Library</Text>
        <Text style={styles.homeButtonHint}>
          View, search, and manage all your standards.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => onNavigate('archived')}
      >
        <Text style={styles.homeButtonText}>Archived Standards</Text>
        <Text style={styles.homeButtonHint}>
          View read-only history and manage archive status.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => onNavigate('dashboard')}
      >
        <Text style={styles.homeButtonText}>Active Standards Dashboard</Text>
        <Text style={styles.homeButtonHint}>
          Track progress and log activity.
        </Text>
      </TouchableOpacity>
      <LogEntryModal
        visible={logModalVisible}
        standard={null}
        onClose={handleLogModalClose}
        onSave={handleLogSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  homeContainer: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111',
  },
  homeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 24,
  },
  homeButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  homeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E1116',
  },
  homeButtonHint: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default App;
