import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Standard } from '@minimum-standards/shared-model';
import { useStandardsLibrary } from '../hooks/useStandardsLibrary';
import { useActivities } from '../hooks/useActivities';
import { ErrorBanner } from '../components/ErrorBanner';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { BUTTON_BORDER_RADIUS } from '../theme/radius';
import { useStandards } from '../hooks/useStandards';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export interface StandardsLibraryScreenProps {
  onBack?: () => void; // Optional - not shown on main screen
  onSelectStandard?: (standard: Standard) => void; // For builder context
  onNavigateToBuilder?: () => void; // Navigate to Standards Builder
  onEditStandard?: (standardId: string) => void; // Navigate to Standards Builder for editing
}

const CARD_SPACING = 16;

export function StandardsLibraryScreen({
  onBack,
  onSelectStandard,
  onNavigateToBuilder,
  onEditStandard,
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
    deleteStandard,
  } = useStandardsLibrary();

  const { activities } = useActivities();
  const { createLogEntry, updateLogEntry } = useStandards();

  // Create activity lookup map
  const activityMap = useMemo(() => {
    const map = new Map<string, string>();
    activities.forEach((activity) => {
      map.set(activity.id, activity.name);
    });
    return map;
  }, [activities]);

  // Combine active and archived standards into a single list
  const allStandards = useMemo(() => {
    return [...activeStandards, ...archivedStandards];
  }, [activeStandards, archivedStandards]);

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

  const handleEdit = useCallback((standardId: string) => {
    if (onEditStandard) {
      onEditStandard(standardId);
    }
  }, [onEditStandard]);

  const handleDelete = useCallback((standardId: string, activityName: string) => {
    Alert.alert(
      'Delete Standard',
      `Are you sure you want to delete "${activityName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStandard(standardId);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete standard');
              console.error('Failed to delete standard:', err);
            }
          },
        },
      ]
    );
  }, [deleteStandard]);

  const handleSelect = useCallback((standard: Standard) => {
    if (onSelectStandard) {
      onSelectStandard(standard);
      // Note: onBack() is not called here because:
      // - When used as a modal (StandardsLibraryModal), the modal wrapper handles closing
      // - When used as a main screen, we navigate forward and shouldn't go back
    }
  }, [onSelectStandard]);

  const handleRetry = useCallback(() => {
    // Refresh standards if needed
  }, []);

  const renderCard = useCallback(
    ({ item }: { item: Standard }) => {
      const activityName = activityMap.get(item.activityId) ?? item.activityId;
      return (
        <StandardCard
          standard={item}
          onSelect={() => handleSelect(item)}
          onArchive={() => handleArchive(item.id)}
          onActivate={() => handleActivate(item.id)}
          onEdit={() => handleEdit(item.id)}
          onDelete={() => handleDelete(item.id, activityName)}
          activityNameMap={activityMap}
          onSelectStandard={onSelectStandard}
        />
      );
    },
    [handleSelect, handleArchive, handleActivate, handleEdit, handleDelete, activityMap, onSelectStandard]
  );

  const content = useMemo(() => {
    if (loading && allStandards.length === 0) {
      return (
        <View style={styles.skeletonContainer} testID="library-skeletons">
          {[0, 1, 2].map((key) => (
            <View key={key} style={[styles.skeletonCard, { backgroundColor: theme.background.card }]}>
              <View style={[styles.skeletonLine, { backgroundColor: theme.background.tertiary }]} />
              <View style={[styles.skeletonLineShort, { backgroundColor: theme.background.tertiary }]} />
            </View>
          ))}
        </View>
      );
    }

    if (allStandards.length === 0) {
      return (
        <View style={styles.emptyContainer} testID="library-empty-state">
          <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
            {searchQuery.trim()
              ? 'No standards match your search'
              : 'No standards'}
          </Text>
          {!searchQuery.trim() && onNavigateToBuilder && (
            <TouchableOpacity
              onPress={onNavigateToBuilder}
              style={[styles.builderButton, { backgroundColor: theme.button.primary.background }]}
              accessibilityRole="button"
            >
              <Text style={[styles.builderButtonText, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.button.primary.text }]}>Create Standard</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <FlatList
        testID="library-list"
        data={allStandards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRetry} />
        }
      />
    );
  }, [
    allStandards,
    loading,
    onNavigateToBuilder,
    renderCard,
    searchQuery,
    theme,
    handleRetry,
  ]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background.screen }]}>
      <View style={[styles.header, { backgroundColor: theme.background.chrome, borderBottomColor: theme.border.secondary, paddingTop: Math.max(insets.top, 12) }]}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} accessibilityRole="button">
            <Text style={[styles.backButton, { color: theme.primary.main }]}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Standards Library</Text>
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

      <ErrorBanner error={error} onRetry={handleRetry} />

      {/* Search Input */}
      <View style={[styles.searchContainer, { borderBottomColor: theme.border.secondary, backgroundColor: theme.background.chrome }]}>
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

      {content}

    </View>
  );
}

function StandardCard({
  standard,
  onSelect,
  onArchive,
  onActivate,
  onEdit,
  onDelete,
  activityNameMap,
  onSelectStandard,
}: {
  standard: Standard;
  onSelect: () => void;
  onArchive: () => void;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  activityNameMap: Map<string, string>;
  onSelectStandard?: (standard: Standard) => void;
}) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuButtonLayout, setMenuButtonLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const menuButtonRef = useRef<View>(null);
  const isActive = standard.state === 'active' && standard.archivedAtMs === null;
  
  // Get activity name from map, fallback to activityId if not found
  const activityName = activityNameMap.get(standard.activityId) ?? standard.activityId;
  
  // Format volume/period: "75 minutes / week"
  const { interval, unit: cadenceUnit } = standard.cadence;
  const cadenceStr = interval === 1 ? cadenceUnit : `${interval} ${cadenceUnit}s`;
  const volumePeriodText = `${standard.minimum} ${standard.unit} / ${cadenceStr}`;
  
  // Format session params: "5 sessions × 15 minutes"
  const sessionConfig = standard.sessionConfig;
  const sessionLabelPlural = sessionConfig.sessionsPerCadence === 1 
    ? sessionConfig.sessionLabel 
    : `${sessionConfig.sessionLabel}s`;
  const sessionParamsText = `${sessionConfig.sessionsPerCadence} ${sessionLabelPlural} × ${sessionConfig.volumePerSession} ${standard.unit}`;

  const handleToggle = useCallback((e: any) => {
    e.stopPropagation();
    if (isActive) {
      onArchive();
    } else {
      onActivate();
    }
  }, [isActive, onArchive, onActivate]);

  const handleMenuPress = useCallback((e: any) => {
    e.stopPropagation();
    // Measure button position when opening menu
    menuButtonRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setMenuButtonLayout({ x, y, width, height });
      setMenuVisible(true);
    });
  }, []);

  const handleEditPress = useCallback(() => {
    setMenuVisible(false);
    onEdit();
  }, [onEdit]);

  const handleDeletePress = useCallback(() => {
    setMenuVisible(false);
    onDelete();
  }, [onDelete]);

  const cardOpacity = isActive ? 1 : 0.6;

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
        onPress={onSelectStandard ? onSelect : undefined}
        activeOpacity={onSelectStandard ? 0.7 : 1}
        accessibilityRole={onSelectStandard ? 'button' : undefined}
        accessibilityLabel={onSelectStandard ? `Select ${activityName}` : undefined}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.titleBlock}>
              <Text
                style={[styles.activityName, { color: theme.text.primary }]}
                numberOfLines={1}
                accessibilityLabel={`Activity ${activityName}`}
              >
                {activityName}
              </Text>
              <Text
                style={[styles.volumePeriodText, { color: theme.text.primary }]}
                numberOfLines={1}
                accessibilityLabel={`Volume: ${volumePeriodText}`}
              >
                {volumePeriodText}
              </Text>
              <Text
                style={[styles.sessionParamsText, { color: theme.text.secondary }]}
                numberOfLines={1}
                accessibilityLabel={`Session params: ${sessionParamsText}`}
              >
                {sessionParamsText}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  onPress={handleToggle}
                  style={styles.toggleContainer}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: isActive }}
                  accessibilityLabel={isActive ? `Deactivate ${activityName}` : `Activate ${activityName}`}
                >
                  <View
                    style={[
                      styles.toggle,
                      {
                        backgroundColor: isActive ? theme.button.primary.background : theme.input.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        {
                          backgroundColor: theme.background.primary,
                          transform: [{ translateX: isActive ? 20 : 0 }],
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
                <View ref={menuButtonRef}>
                  <TouchableOpacity
                    onPress={handleMenuPress}
                    style={styles.menuButton}
                    accessibilityRole="button"
                    accessibilityLabel={`More options for ${activityName}`}
                  >
                    <MaterialIcons name="more-vert" size={20} color={theme.button.icon.icon} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>

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
                accessibilityLabel={`Edit ${activityName}`}
              >
                <MaterialIcons name="edit" size={20} color={theme.button.icon.icon} />
                <Text style={[styles.menuItemText, { color: theme.button.icon.icon }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeletePress}
                style={styles.menuItem}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${activityName}`}
              >
                <MaterialIcons name="delete" size={20} color={theme.button.icon.icon} />
                <Text style={[styles.menuItemText, { color: theme.button.icon.icon }]}>Delete</Text>
              </TouchableOpacity>
              </View>
            );
          })()}
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_SPACING,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 64,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BUTTON_BORDER_RADIUS,
  },
  headerButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
  searchContainer: {
    padding: CARD_SPACING,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  skeletonContainer: {
    padding: CARD_SPACING,
    gap: CARD_SPACING,
  },
  skeletonCard: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 8,
  },
  skeletonLineShort: {
    height: 16,
    width: '60%',
    borderRadius: 8,
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
  builderButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BUTTON_BORDER_RADIUS,
  },
  builderButtonText: {
    // fontSize and fontWeight come from typography.button.primary
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
  volumePeriodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sessionParamsText: {
    fontSize: 13,
  },
  headerActions: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  toggleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
});
