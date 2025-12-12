import React, { useEffect, useRef, useState } from 'react';
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
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            } catch (err) {
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
    } catch (err) {
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
        <Text style={styles.activityInputType}>
          {item.inputType === 'number' ? 'Number' : 'Yes/No'}
        </Text>
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
      {/* Header with close button if in modal context */}
      {onClose && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activity Library</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search activities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Add button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
        <Text style={styles.addButtonText}>+ Add Activity</Text>
      </TouchableOpacity>

      {/* Activity list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No activities found' : 'No activities yet'}
          </Text>
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
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  addButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  activityInputType: {
    fontSize: 14,
    color: '#999',
    marginLeft: 16,
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
