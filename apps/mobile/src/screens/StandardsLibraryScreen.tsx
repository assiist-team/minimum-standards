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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Standard } from '@minimum-standards/shared-model';
import { useStandardsLibrary } from '../hooks/useStandardsLibrary';
import { useActivities } from '../hooks/useActivities';
import { ErrorBanner } from '../components/ErrorBanner';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';

export interface StandardsLibraryScreenProps {
  onBack?: () => void; // Optional - not shown on main screen
  onSelectStandard?: (standard: Standard) => void; // For builder context
  onNavigateToBuilder?: () => void; // Navigate to Standards Builder
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
  onNavigateToBuilder,
}: StandardsLibraryScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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
      if (onBack) {
        onBack();
      }
    }
  };

  const renderStandardItem = ({ item }: { item: Standard }) => {
    const activityName = activityMap.get(item.activityId) || 'Unknown Activity';
    const cadenceDisplay = formatCadenceDisplay(item.cadence);
    const isActive = item.state === 'active' && item.archivedAtMs === null;

    return (
      <View style={[styles.standardItem, { borderBottomColor: theme.border.secondary }]}>
        <TouchableOpacity
          style={styles.standardContent}
          onPress={() => handleSelect(item)}
          disabled={!onSelectStandard}
        >
          <View style={styles.standardInfo}>
            <Text style={[styles.standardSummary, { color: theme.text.primary }]}>{item.summary}</Text>
            <Text style={[styles.standardActivity, { color: theme.text.secondary }]}>{activityName}</Text>
            <Text style={[styles.standardCadence, { color: theme.text.secondary }]}>{cadenceDisplay}</Text>
            <Text style={[styles.standardMinimum, { color: theme.text.secondary }]}>
              Minimum: {item.minimum} {item.unit}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.standardActions}>
          {isActive ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.archive.background }]}
              onPress={() => handleArchive(item.id)}
            >
              <Text style={[styles.archiveButtonText, { fontSize: typography.button.small.fontSize, fontWeight: typography.button.small.fontWeight, color: theme.archive.text }]}>Archive</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.activateButton]}
              onPress={() => handleActivate(item.id)}
            >
              <Text style={[styles.activateButtonText, { fontSize: typography.button.small.fontSize, fontWeight: typography.button.small.fontWeight }]}>Activate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background.secondary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border.secondary, paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Standards Library</Text>
        {onNavigateToBuilder ? (
          <TouchableOpacity
            onPress={onNavigateToBuilder}
            style={[styles.headerButton, { backgroundColor: theme.button.primary.background }]}
            accessibilityRole="button"
          >
            <Text style={[styles.headerButtonText, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.button.primary.text }]}>+ New</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>
      <ErrorBanner error={error} />

      {/* Search Input */}
      <View style={[styles.searchContainer, { borderBottomColor: theme.border.secondary, backgroundColor: theme.background.tertiary }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.input.background,
              borderColor: theme.input.border,
              color: theme.input.text,
            },
          ]}
          placeholder="Search standards..."
          placeholderTextColor={theme.input.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Standards search input"
        />
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { borderBottomColor: theme.border.secondary, backgroundColor: theme.background.tertiary }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'active' && { borderBottomColor: theme.link },
          ]}
          onPress={() => setActiveTab('active')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'active' ? theme.link : theme.text.secondary },
            ]}
          >
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'archived' && { borderBottomColor: theme.link },
          ]}
          onPress={() => setActiveTab('archived')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'archived' ? theme.link : theme.text.secondary },
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
            <ActivityIndicator size="large" color={theme.activityIndicator} />
          </View>
        ) : currentStandards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
              {searchQuery.trim()
                ? 'No standards match your search'
                : 'No standards'}
            </Text>
            {!searchQuery.trim() && onNavigateToBuilder && (
              <TouchableOpacity
                onPress={onNavigateToBuilder}
                style={[styles.createButton, { backgroundColor: theme.button.primary.background }]}
                accessibilityRole="button"
              >
                <Text style={[styles.createButtonText, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.button.primary.text }]}>Create Standard</Text>
              </TouchableOpacity>
            )}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    // fontSize and fontWeight come from typography.button.primary
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 60, // Match back button width for centering
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
  createButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
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
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
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
    marginBottom: 4,
  },
  standardActivity: {
    fontSize: 14,
    marginBottom: 2,
  },
  standardCadence: {
    fontSize: 14,
    marginBottom: 2,
  },
  standardMinimum: {
    fontSize: 14,
  },
  standardActions: {
    marginLeft: 16,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  archiveButtonText: {
    // fontSize and fontWeight come from typography.button.small
  },
  activateButton: {
    backgroundColor: '#e8f5e9',
  },
  activateButtonText: {
    color: '#2e7d32',
    // fontSize and fontWeight come from typography.button.small
  },
});
