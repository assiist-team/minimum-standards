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
import { useActivities } from '../hooks/useActivities';
import { ActivityModal } from '../components/ActivityModal';
import { Activity } from '@minimum-standards/shared-model';

/**
 * Standalone Activity Library screen.
 * Can be used as a standalone screen or embedded in a modal for builder context.
 */

export interface ActivityLibraryScreenProps {
  onSelectActivity?: (activity: Activity) => void; // For builder context
  hideDestructiveControls?: boolean; // Hide edit/delete in builder context
  onClose?: () => void; // For modal context - show close button
}

export function ActivityLibraryScreen({
  onSelectActivity,
  hideDestructiveControls = false,
  onClose,
}: ActivityLibraryScreenProps) {
  const {
    activities,
    recentActivities,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    createActivity,
    updateActivity,
    deleteActivity,
    restoreActivity,
  } = useActivities();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [undoActivity, setUndoActivity] = useState<Activity | null>(null);
  const [hasFocusedSearch, setHasFocusedSearch] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmedQuery = searchQuery.trim();
  const showRecents = hasFocusedSearch && trimmedQuery.length === 0;
  const showResults = hasFocusedSearch && trimmedQuery.length > 0;
  const showPrefocusState = !hasFocusedSearch;

  const recentsEmptyCopy = useMemo(() => {
    if (recentActivities.length === 0) {
      return 'No recents yet — search or create an activity to get started.';
    }
    return null;
  }, [recentActivities.length]);

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
    <View style={styles.activityItem}>
      <TouchableOpacity
        style={styles.activityContent}
        onPress={() => handleSelect(item)}
        disabled={!onSelectActivity}
      >
        <View style={styles.activityInfo}>
          <Text style={styles.activityName}>{item.name}</Text>
          <Text style={styles.activityUnit}>{item.unit}</Text>
        </View>
      </TouchableOpacity>
      {!hideDestructiveControls && (
        <View style={styles.activityActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditPress(item)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeletePress(item)}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {onClose && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activity Library</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search activities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => {
              setHasFocusedSearch(true);
              setIsSearchFocused(true);
            }}
            onBlur={() => setIsSearchFocused(false)}
            accessibilityLabel="Activity search input"
          />
          <TouchableOpacity
            style={styles.inlineCreateButton}
            onPress={handleAddPress}
            accessibilityRole="button"
          >
            <Text style={styles.inlineCreateButtonText}>+ Create</Text>
          </TouchableOpacity>
        </View>
        {hasFocusedSearch && (
          <Text style={styles.searchHint}>
            Showing {showRecents ? 'recent picks' : 'search results'}
          </Text>
        )}
      </View>

      <View style={styles.listArea}>
        {showPrefocusState && (
          <View style={styles.prefocusContainer}>
            <Text style={styles.prefocusTitle}>Start with search</Text>
            <Text style={styles.prefocusSubtitle}>
              Tap the search field to reveal your five most recent activities.
            </Text>
          </View>
        )}

        {showRecents && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent activities</Text>
              {isSearchFocused && (
                <Text style={styles.sectionHint}>Recents refresh on focus</Text>
              )}
            </View>
            {recentsEmptyCopy ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{recentsEmptyCopy}</Text>
              </View>
            ) : (
              <FlatList
                data={recentActivities}
                renderItem={renderActivityItem}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        )}

        {showResults && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Search results</Text>
              {loading && <ActivityIndicator size="small" color="#007AFF" />}
            </View>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            ) : activities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No activities found</Text>
              </View>
            ) : (
              <FlatList
                data={activities}
                renderItem={renderActivityItem}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
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
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>
            Activity deleted
          </Text>
          <TouchableOpacity onPress={handleUndoDelete}>
            <Text style={styles.snackbarAction}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fafafa',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inlineCreateButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0F62FE',
  },
  inlineCreateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  searchHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#596174',
  },
  listArea: {
    flex: 1,
  },
  prefocusContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 8,
  },
  prefocusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E1116',
  },
  prefocusSubtitle: {
    fontSize: 14,
    color: '#5f6368',
    textAlign: 'center',
  },
  section: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
  },
  sectionHint: {
    fontSize: 12,
    color: '#80868b',
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
    borderBottomColor: '#eee',
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
    color: '#333',
    marginBottom: 4,
  },
  activityUnit: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
  deleteButtonText: {
    color: '#d32f2f',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    padding: 16,
    textAlign: 'center',
  },
  snackbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: '#323232',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  snackbarText: {
    color: '#fff',
    fontSize: 14,
  },
  snackbarAction: {
    color: '#4DBAF7',
    fontWeight: '600',
    fontSize: 14,
  },
});
