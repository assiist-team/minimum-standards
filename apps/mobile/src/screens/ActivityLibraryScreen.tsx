import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActivities } from '../hooks/useActivities';
import { useStandards } from '../hooks/useStandards';
import { ActivityModal } from '../components/ActivityModal';
import { Activity } from '@minimum-standards/shared-model';
import { ErrorBanner } from '../components/ErrorBanner';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { filterActivitiesByTab } from '../utils/activitiesFilter';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * Standalone Activity Library screen.
 * Can be used as a standalone screen or embedded in a modal for builder context.
 */

export interface ActivityLibraryScreenProps {
  onSelectActivity?: (activity: Activity) => void; // For builder context
  hideDestructiveControls?: boolean; // Hide edit/delete in builder context
  onClose?: () => void; // For modal context - show close button
}

type Tab = 'active' | 'inactive';

export function ActivityLibraryScreen({
  onSelectActivity,
  hideDestructiveControls = false,
  onClose,
}: ActivityLibraryScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    activities,
    allActivities,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    createActivity,
    updateActivity,
    deleteActivity,
    restoreActivity,
  } = useActivities();

  const { activeStandards } = useStandards();
  const [activeTab, setActiveTab] = useState<Tab>('active');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [undoActivity, setUndoActivity] = useState<Activity | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmedQuery = searchQuery.trim();
  const hasSearchQuery = trimmedQuery.length > 0;

  // Filter activities by tab (active/inactive) after search filtering
  const currentActivities = useMemo(() => {
    return filterActivitiesByTab(activities, activeStandards, activeTab);
  }, [activities, activeStandards, activeTab]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const scheduleUndoClear = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    undoTimerRef.current = setTimeout(() => {
      setUndoActivity(null);
      undoTimerRef.current = null;
    }, 5000);
  };

  const handleAddPress = () => {
    setEditingActivity(null);
    setModalVisible(true);
  };

  const handleEditPress = (activity: Activity) => {
    setEditingActivity(activity);
    setModalVisible(true);
  };

  const handleDeletePress = (activity: Activity) => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${activity.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteActivity(activity.id);
              setUndoActivity(activity);
              scheduleUndoClear();
            } catch {
              Alert.alert('Error', 'Failed to delete activity');
            }
          },
        },
      ]
    );
  };

  const handleUndoDelete = async () => {
    if (!undoActivity) {
      return;
    }

    try {
      await restoreActivity(undoActivity);
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
      setUndoActivity(null);
    } catch {
      Alert.alert('Error', 'Failed to restore activity');
    }
  };

  const handleSave = async (
    activityData: Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'>
  ): Promise<Activity> => {
    if (editingActivity) {
      await updateActivity(editingActivity.id, activityData);
      // Return the updated activity (we'll reconstruct it)
      return {
        ...editingActivity,
        ...activityData,
        updatedAtMs: Date.now(),
      } as Activity;
    } else {
      return await createActivity(activityData);
    }
  };

  const handleSelect = (activity: Activity) => {
    if (onSelectActivity) {
      onSelectActivity(activity);
    }
  };

  const renderActivityItem = ({ item }: { item: Activity }) => (
    <View style={[styles.activityItem, { borderBottomColor: theme.border.secondary }]}>
      <TouchableOpacity
        style={styles.activityContent}
        onPress={() => handleSelect(item)}
        disabled={!onSelectActivity}
      >
        <View style={styles.activityInfo}>
          <Text style={[styles.activityName, { color: theme.text.primary }]}>{item.name}</Text>
          <Text style={[styles.activityUnit, { color: theme.text.secondary }]}>{item.unit}</Text>
        </View>
      </TouchableOpacity>
      {!hideDestructiveControls && (
        <View style={styles.activityActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.button.icon.background }]}
            onPress={() => handleEditPress(item)}
            accessibilityLabel="Edit activity"
            accessibilityRole="button"
          >
            <MaterialIcons name="edit" size={20} color={theme.button.icon.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton, { backgroundColor: theme.button.icon.background }]}
            onPress={() => handleDeletePress(item)}
            accessibilityLabel="Delete activity"
            accessibilityRole="button"
          >
            <MaterialIcons name="delete" size={20} color={theme.button.icon.icon} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background.secondary }]}>
      <ErrorBanner error={error} />

      <View style={[styles.searchContainer, { borderBottomColor: theme.border.secondary, backgroundColor: theme.background.tertiary, paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.searchRow}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.input.background,
                borderColor: theme.input.border,
                color: theme.input.text,
              },
            ]}
            placeholder="Search activities..."
            placeholderTextColor={theme.input.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => {
              setIsSearchFocused(true);
            }}
            onBlur={() => setIsSearchFocused(false)}
            accessibilityLabel="Activity search input"
          />
          <TouchableOpacity
            style={[styles.inlineCreateButton, { backgroundColor: theme.button.primary.background }]}
            onPress={handleAddPress}
            accessibilityRole="button"
          >
            <Text style={[styles.inlineCreateButtonText, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.button.primary.text }]}>+ Create</Text>
          </TouchableOpacity>
        </View>
        {hasSearchQuery && currentActivities.length > 0 && (
          <Text style={[styles.searchHint, { color: theme.text.secondary }]}>
            Found {currentActivities.length} {currentActivities.length === 1 ? 'activity' : 'activities'}
          </Text>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { borderBottomColor: theme.border.secondary, backgroundColor: theme.background.secondary }]}>
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
            activeTab === 'inactive' && { borderBottomColor: theme.link },
          ]}
          onPress={() => setActiveTab('inactive')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'inactive' ? theme.link : theme.text.secondary },
            ]}
          >
            Inactive
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listArea}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.activityIndicator} />
          </View>
        ) : allActivities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
              No activities
            </Text>
            <TouchableOpacity
              onPress={handleAddPress}
              style={[styles.createButton, { backgroundColor: theme.button.primary.background }]}
              accessibilityRole="button"
            >
              <Text style={[styles.createButtonText, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.button.primary.text }]}>Create Activity</Text>
            </TouchableOpacity>
          </View>
        ) : currentActivities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
              {hasSearchQuery
                ? 'No activities found matching your search'
                : activeTab === 'active'
                ? 'No active activities'
                : 'No inactive activities'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={currentActivities}
            renderItem={renderActivityItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Modal */}
      <ActivityModal
        visible={modalVisible}
        activity={editingActivity}
        onClose={() => {
          setModalVisible(false);
          setEditingActivity(null);
        }}
        onSave={handleSave}
        onSelect={onSelectActivity ? handleSelect : undefined}
      />

      {/* Undo snackbar */}
      {undoActivity && (
        <View style={[styles.snackbar, { backgroundColor: theme.background.tertiary, shadowColor: theme.shadow }]}>
          <Text style={[styles.snackbarText, { color: theme.text.inverse }]}>
            Activity deleted
          </Text>
          <TouchableOpacity onPress={handleUndoDelete}>
            <Text style={[styles.snackbarAction, { color: theme.link }]}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inlineCreateButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  inlineCreateButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
  searchHint: {
    marginTop: 8,
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
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
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityUnit: {
    fontSize: 14,
  },
  activityActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 16,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {},
  snackbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  snackbarText: {
    fontSize: 14,
  },
  snackbarAction: {
    fontWeight: '600',
    fontSize: 14,
  },
});
