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
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActivities } from '../hooks/useActivities';
import { useStandards } from '../hooks/useStandards';
import { ActivityModal } from '../components/ActivityModal';
import { Activity } from '@minimum-standards/shared-model';
import { ErrorBanner } from '../components/ErrorBanner';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { BUTTON_BORDER_RADIUS } from '../theme/radius';
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

const CARD_SPACING = 16;

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

  const { activeStandards, createLogEntry, updateLogEntry } = useStandards();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [undoActivity, setUndoActivity] = useState<Activity | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmedQuery = searchQuery.trim();
  const hasSearchQuery = trimmedQuery.length > 0;

  // Create a set of activity IDs that are referenced by active standards
  const activeActivityIds = useMemo(() => {
    const ids = new Set<string>();
    activeStandards.forEach((standard) => {
      if (standard.archivedAtMs === null && standard.state === 'active') {
        ids.add(standard.activityId);
      }
    });
    return ids;
  }, [activeStandards]);

  // Sort activities: those part of activated standards first, then others
  // Maintain alphabetical order within each group
  // Activities part of activated standards should have muted appearance
  const sortedActivities = useMemo(() => {
    const sorted = [...activities].sort((a, b) => {
      const aIsActive = activeActivityIds.has(a.id);
      const bIsActive = activeActivityIds.has(b.id);
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      // If both are in the same group, sort alphabetically
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [activities, activeActivityIds]);

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

  const renderActivityItem = ({ item }: { item: Activity }) => {
    const isPartOfActivatedStandard = activeActivityIds.has(item.id);
    const cardOpacity = isPartOfActivatedStandard ? 0.6 : 1;
    
    return (
      <ActivityCard
        activity={item}
        isPartOfActivatedStandard={isPartOfActivatedStandard}
        cardOpacity={cardOpacity}
        onSelect={handleSelect}
        onEdit={handleEditPress}
        onDelete={handleDeletePress}
        hideDestructiveControls={hideDestructiveControls}
        onSelectActivity={onSelectActivity}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background.screen }]}>
      <ErrorBanner error={error} />

      <View style={[styles.searchContainer, { borderBottomColor: theme.border.secondary, backgroundColor: theme.background.chrome, paddingTop: Math.max(insets.top, 16) }]}>
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
        {hasSearchQuery && sortedActivities.length > 0 && (
          <Text style={[styles.searchHint, { color: theme.text.secondary }]}>
            Found {sortedActivities.length} {sortedActivities.length === 1 ? 'activity' : 'activities'}
          </Text>
        )}
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
        ) : sortedActivities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
              {hasSearchQuery
                ? 'No activities found matching your search'
                : 'No activities'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={sortedActivities}
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

function ActivityCard({
  activity,
  isPartOfActivatedStandard,
  cardOpacity,
  onSelect,
  onEdit,
  onDelete,
  hideDestructiveControls,
  onSelectActivity,
}: {
  activity: Activity;
  isPartOfActivatedStandard: boolean;
  cardOpacity: number;
  onSelect: (activity: Activity) => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  hideDestructiveControls: boolean;
  onSelectActivity?: (activity: Activity) => void;
}) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuButtonLayout, setMenuButtonLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const menuButtonRef = useRef<View>(null);

  const handleMenuPress = (e: any) => {
    e.stopPropagation();
    // Measure button position when opening menu
    menuButtonRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setMenuButtonLayout({ x, y, width, height });
      setMenuVisible(true);
    });
  };

  const handleEditPress = () => {
    setMenuVisible(false);
    onEdit(activity);
  };

  const handleDeletePress = () => {
    setMenuVisible(false);
    onDelete(activity);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: theme.background.card,
            shadowColor: theme.shadow,
            opacity: cardOpacity,
          },
        ]}
        onPress={onSelectActivity ? () => onSelect(activity) : undefined}
        activeOpacity={onSelectActivity ? 0.7 : 1}
        accessibilityRole={onSelectActivity ? 'button' : undefined}
        accessibilityLabel={onSelectActivity ? `Select ${activity.name}` : undefined}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.titleBlock}>
              <Text
                style={[styles.activityName, { color: theme.text.primary }]}
                numberOfLines={1}
                accessibilityLabel={`Activity ${activity.name}`}
              >
                {activity.name}
              </Text>
              <Text
                style={[styles.activityUnit, { color: theme.text.secondary }]}
                numberOfLines={1}
                accessibilityLabel={`Unit: ${activity.unit}`}
              >
                {activity.unit}
              </Text>
            </View>
            {!hideDestructiveControls && (
              <View style={styles.headerActions}>
                <View ref={menuButtonRef}>
                  <TouchableOpacity
                    onPress={handleMenuPress}
                    style={styles.menuButton}
                    accessibilityRole="button"
                    accessibilityLabel={`More options for ${activity.name}`}
                  >
                    <MaterialIcons name="more-vert" size={20} color={theme.button.icon.icon} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {!hideDestructiveControls && (
        <Modal
          visible={menuVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          >
            {menuButtonLayout && (() => {
              const screenWidth = Dimensions.get('window').width;
              const menuWidth = 200;
              const buttonRightEdge = menuButtonLayout.x + menuButtonLayout.width;
              // Align menu's right edge with button's right edge
              let menuLeft = buttonRightEdge - menuWidth;
              // Ensure menu doesn't go off the left or right edge of screen
              menuLeft = Math.max(16, Math.min(menuLeft, screenWidth - menuWidth - 16));
              
              return (
                <View
                  style={[
                    styles.menuContainer,
                    {
                      backgroundColor: theme.background.modal,
                      top: menuButtonLayout.y + menuButtonLayout.height + 4,
                      left: menuLeft,
                    },
                  ]}
                  onStartShouldSetResponder={() => true}
                >
                  <TouchableOpacity
                    onPress={handleEditPress}
                    style={[styles.menuItem, { borderBottomColor: theme.border.secondary }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${activity.name}`}
                  >
                    <MaterialIcons name="edit" size={20} color={theme.button.icon.icon} />
                    <Text style={[styles.menuItemText, { color: theme.button.icon.icon }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDeletePress}
                    style={styles.menuItem}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${activity.name}`}
                  >
                    <MaterialIcons name="delete" size={20} color={theme.button.icon.icon} />
                    <Text style={[styles.menuItemText, { color: theme.button.icon.icon }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </TouchableOpacity>
        </Modal>
      )}
    </>
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
    borderRadius: BUTTON_BORDER_RADIUS,
  },
  inlineCreateButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
  searchHint: {
    marginTop: 8,
    fontSize: 12,
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
    borderRadius: BUTTON_BORDER_RADIUS,
  },
  createButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: CARD_SPACING,
    gap: CARD_SPACING,
  },
  card: {
    borderRadius: 16,
    padding: 0,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  cardContent: {
    gap: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityUnit: {
    fontSize: 14,
  },
  headerActions: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  menuButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    minHeight: 32,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    borderRadius: 12,
    minWidth: 200,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
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
