import React, { useState } from 'react';
import { Activity } from '@minimum-standards/shared-model';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { ActivityLibraryModal } from '../components/ActivityLibraryModal';

export interface StandardsBuilderScreenProps {
  onBack: () => void;
}

export function StandardsBuilderScreen({ onBack }: StandardsBuilderScreenProps) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [libraryVisible, setLibraryVisible] = useState(false);

  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity);
    setLibraryVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Standards Builder</Text>
        <View style={{ width: 64 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Activity Selection</Text>
        {selectedActivity ? (
          <View style={styles.selectionCard}>
            <Text style={styles.selectionLabel}>Selected Activity</Text>
            <Text style={styles.selectionName}>{selectedActivity.name}</Text>
            <Text style={styles.selectionMeta}>{selectedActivity.unit}</Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>
            Choose an activity to link to this Standard.
          </Text>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setLibraryVisible(true)}
        >
          <Text style={styles.primaryButtonText}>
            {selectedActivity ? 'Change Activity' : 'Open Activity Library'}
          </Text>
        </TouchableOpacity>
      </View>

      <ActivityLibraryModal
        visible={libraryVisible}
        onClose={() => setLibraryVisible(false)}
        onSelectActivity={handleActivitySelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  backButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  placeholderText: {
    fontSize: 14,
    color: '#666'
  },
  selectionCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    gap: 4
  },
  selectionLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  selectionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222'
  },
  selectionMeta: {
    fontSize: 14,
    color: '#555'
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

