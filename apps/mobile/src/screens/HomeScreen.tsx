import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { LogEntryModal } from '../components/LogEntryModal';
import { useStandards } from '../hooks/useStandards';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
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
        onPress={() => navigation.navigate('ActivityLibrary')}
      >
        <Text style={styles.homeButtonText}>Activity Library</Text>
        <Text style={styles.homeButtonHint}>
          Manage and reuse activities.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate('StandardsBuilder')}
      >
        <Text style={styles.homeButtonText}>Standards Builder</Text>
        <Text style={styles.homeButtonHint}>
          Select activities from the builder flow.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate('StandardsLibrary')}
      >
        <Text style={styles.homeButtonText}>Standards Library</Text>
        <Text style={styles.homeButtonHint}>
          View, search, and manage all your standards.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate('ArchivedStandards')}
      >
        <Text style={styles.homeButtonText}>Archived Standards</Text>
        <Text style={styles.homeButtonHint}>
          View read-only history and manage archive status.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate('ActiveStandardsDashboard')}
      >
        <Text style={styles.homeButtonText}>Active Standards Dashboard</Text>
        <Text style={styles.homeButtonHint}>
          Track progress and log activity.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.homeButtonText}>Settings</Text>
        <Text style={styles.homeButtonHint}>
          Manage your account and preferences.
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
