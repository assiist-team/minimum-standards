import React, { useMemo, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ActivityLibraryScreen } from './src/screens/ActivityLibraryScreen';
import { StandardsBuilderScreen } from './src/screens/StandardsBuilderScreen';

type RootView = 'home' | 'library' | 'builder';

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
      default:
        return <HomeScreen onNavigate={setView} />;
    }
  }, [view]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safeArea}>{content}</SafeAreaView>
    </SafeAreaProvider>
  );
}

function HomeScreen({ onNavigate }: { onNavigate: (next: RootView) => void }) {
  return (
    <View style={styles.homeContainer}>
      <Text style={styles.appTitle}>Minimum Standards</Text>
      <Text style={styles.homeSubtitle}>
        Choose a workflow to get started.
      </Text>
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
