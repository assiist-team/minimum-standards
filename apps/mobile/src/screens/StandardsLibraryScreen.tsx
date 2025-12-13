import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Standard } from '@minimum-standards/shared-model';
import { useStandardsLibrary } from '../hooks/useStandardsLibrary';
import { useActivities } from '../hooks/useActivities';
import { ErrorBanner } from '../components/ErrorBanner';

export interface StandardsLibraryScreenProps {
  onBack: () => void;
  onSelectStandard?: (standard: Standard) => void; // For builder context
}

type Tab = 'active' | 'archived';

/**
 * Formats cadence display string from StandardCadence.
 * Example: { interval: 1, unit: 'week' } => "every week"
 * Example: { interval: 2, unit: 'day' } => "every 2 days"
 */
function formatCadenceDisplay(cadence: Standard['cadence']): string {
  const { interval, unit } = cadence;
  if (interval === 1) {
    return `every ${unit}`;
  }
  return `every ${interval} ${unit}s`;
}

export function StandardsLibraryScreen({
  onBack,
  onSelectStandard,
}: StandardsLibraryScreenProps) {
  const {
    activeStandards,
    archivedStandards,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    archiveStandard,
    unarchiveStandard,
  } = useStandardsLibrary();

  const { activities } = useActivities();
  const [activeTab, setActiveTab] = useState<Tab>('active');

  // Create activity lookup map
  const activityMap = useMemo(() => {
    const map = new Map<string, string>();
    activities.forEach((activity) => {
      map.set(activity.id, activity.name);
    });
    return map;
  }, [activities]);

  const currentStandards =
    activeTab === 'active' ? activeStandards : archivedStandards;

  const handleArchive = async (standardId: string) => {
    try {
      await archiveStandard(standardId);
    } catch (err) {
      // Error handling - could show toast/alert
      console.error('Failed to archive standard:', err);
    }
  };

  const handleActivate = async (standardId: string) => {
    try {
      await unarchiveStandard(standardId);
    } catch (err) {
      // Error handling - could show toast/alert
      console.error('Failed to activate standard:', err);
    }
  };

  const handleSelect = (standard: Standard) => {
    if (onSelectStandard) {
      onSelectStandard(standard);
      onBack();
    }
  };

  const renderStandardItem = ({ item }: { item: Standard }) => {
    const activityName = activityMap.get(item.activityId) || 'Unknown Activity';
    const cadenceDisplay = formatCadenceDisplay(item.cadence);
    const isActive = item.state === 'active' && item.archivedAtMs === null;

    return (
      <View style={styles.standardItem}>
        <TouchableOpacity
          style={styles.standardContent}
          onPress={() => handleSelect(item)}
          disabled={!onSelectStandard}
        >
          <View style={styles.standardInfo}>
            <Text style={styles.standardSummary}>{item.summary}</Text>
            <Text style={styles.standardActivity}>{activityName}</Text>
            <Text style={styles.standardCadence}>{cadenceDisplay}</Text>
            <Text style={styles.standardMinimum}>
              Minimum: {item.minimum} {item.unit}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.standardActions}>
          {isActive ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.archiveButton]}
              onPress={() => handleArchive(item.id)}
            >
              <Text style={styles.archiveButtonText}>Archive</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.activateButton]}
              onPress={() => handleActivate(item.id)}
            >
              <Text style={styles.activateButtonText}>Activate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Standards Library</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ErrorBanner error={error} />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search standards..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Standards search input"
        />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'active' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('active')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'active' && styles.tabTextActive,
            ]}
          >
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'archived' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('archived')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'archived' && styles.tabTextActive,
            ]}
          >
            Archived
          </Text>
        </TouchableOpacity>
      </View>

      {/* Standards List */}
      <View style={styles.listArea}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : currentStandards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? 'No standards match your search'
                : `No ${activeTab} standards`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={currentStandards}
            renderItem={renderStandardItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 60, // Match back button width for centering
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fafafa',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fafafa',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  standardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  standardContent: {
    flex: 1,
  },
  standardInfo: {
    flex: 1,
  },
  standardSummary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  standardActivity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  standardCadence: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  standardMinimum: {
    fontSize: 14,
    color: '#666',
  },
  standardActions: {
    marginLeft: 16,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  archiveButton: {
    backgroundColor: '#ffebee',
  },
  archiveButtonText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '600',
  },
  activateButton: {
    backgroundColor: '#e8f5e9',
  },
  activateButtonText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '600',
  },
});
