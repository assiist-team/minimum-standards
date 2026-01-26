import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { SETTINGS_TAB_ROUTE_NAME } from '../navigation/types';
import type { Standard } from '@minimum-standards/shared-model';
import { UNCATEGORIZED_CATEGORY_ID } from '@minimum-standards/shared-model';
import { useActiveStandardsDashboard } from '../hooks/useActiveStandardsDashboard';
import type { DashboardStandard } from '../hooks/useActiveStandardsDashboard';
import { useActivities } from '../hooks/useActivities';
import { useCategories } from '../hooks/useCategories';
import type { Activity } from '@minimum-standards/shared-model';
import { useUIPreferencesStore } from '../stores/uiPreferencesStore';
import { trackStandardEvent } from '../utils/analytics';
import { LogEntryModal } from '../components/LogEntryModal';
import { ErrorBanner } from '../components/ErrorBanner';
import { StandardProgressCard } from '../components/StandardProgressCard';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { BUTTON_BORDER_RADIUS } from '../theme/radius';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const CARD_SPACING = 16;
const CARD_VERTICAL_GAP = CARD_SPACING / 3;

type SortOption = 'completion' | 'alpha';

export interface ActiveStandardsDashboardScreenProps {
  onBack?: () => void;
  onLaunchBuilder: () => void;
  onOpenLogModal?: (standard: Standard) => void;
  onNavigateToDetail?: (standardId: string) => void;
  onEditStandard?: (standardId: string) => void;
  backButtonLabel?: string;
}

export function ActiveStandardsDashboardScreen({
  onBack,
  onLaunchBuilder,
  onOpenLogModal,
  onNavigateToDetail,
  onEditStandard,
  backButtonLabel,
}: ActiveStandardsDashboardScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('completion');
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  const [sortMenuExpanded, setSortMenuExpanded] = useState(false);
  const filterTabsScrollRef = useRef<ScrollView>(null);
  const filterTabLayouts = useRef<Record<string, { x: number; width: number }>>({});
  
  const {
    dashboardStandards,
    loading,
    error,
    refreshProgress,
    createLogEntry,
    updateLogEntry,
    refreshStandards,
    archiveStandard,
  } = useActiveStandardsDashboard();

  const { activities, updateActivity } = useActivities();
  const { orderedCategories } = useCategories();
  
  // Create activity lookup map for category resolution
  const activityMap = useMemo(() => {
    const map = new Map<string, Activity>();
    activities.forEach((activity) => {
      map.set(activity.id, activity);
    });
    return map;
  }, [activities]);
  const { focusedCategoryId, setFocusedCategoryId } = useUIPreferencesStore();

  // Create activity lookup map for efficient name resolution
  const activityNameMap = useMemo(() => {
    const map = new Map<string, string>();
    activities.forEach((activity) => {
      map.set(activity.id, activity.name);
    });
    return map;
  }, [activities]);

  const customCategories = useMemo(() => {
    return orderedCategories.filter(
      (c) => !c.isSystem && c.id !== UNCATEGORIZED_CATEGORY_ID
    );
  }, [orderedCategories]);

  const hasCustomCategories = customCategories.length > 0;
  const cardCategorizeLabel = hasCustomCategories ? 'Categorize' : 'Create categories';

  // If the user has no custom categories (or a category was deleted), clear any focused filter.
  useEffect(() => {
    if (!hasCustomCategories) {
      if (focusedCategoryId !== null) {
        setFocusedCategoryId(null);
      }
      return;
    }

    if (focusedCategoryId === null) {
      return;
    }

    const allowed = new Set<string>([
      ...customCategories.map((c) => c.id),
      UNCATEGORIZED_CATEGORY_ID,
    ]);
    if (!allowed.has(focusedCategoryId)) {
      setFocusedCategoryId(null);
    }
  }, [customCategories, focusedCategoryId, hasCustomCategories, setFocusedCategoryId]);

  const getEffectiveCategoryId = useCallback(
    (entry: DashboardStandard): string => {
      const activity = activityMap.get(entry.standard.activityId);
      const effectiveCategoryId = activity?.categoryId ?? entry.standard.categoryId ?? null;
      return effectiveCategoryId ?? UNCATEGORIZED_CATEGORY_ID;
    },
    [activityMap]
  );

  const handleLogPress = useCallback(
    (entry: DashboardStandard) => {
      trackStandardEvent('dashboard_log_tap', {
        standardId: entry.standard.id,
        activityId: entry.standard.activityId,
      });

      if (onOpenLogModal) {
        onOpenLogModal(entry.standard);
      } else {
        setSelectedStandard(entry.standard);
        setLogModalVisible(true);
      }
    },
    [onOpenLogModal]
  );

  const handleLogSave = useCallback(
    async (standardId: string, value: number, occurredAtMs: number, note?: string | null, logEntryId?: string) => {
      if (logEntryId && updateLogEntry) {
        // Edit mode: use updateLogEntry
        await updateLogEntry({ logEntryId, standardId, value, occurredAtMs, note });
      } else {
        // Create mode: use createLogEntry
        await createLogEntry({ standardId, value, occurredAtMs, note });
      }
      // Firestore listener will automatically update the UI
    },
    [createLogEntry, updateLogEntry]
  );

  const handleLogModalClose = useCallback(() => {
    setLogModalVisible(false);
    setSelectedStandard(null);
  }, []);

  const handleRetry = useCallback(() => {
    refreshProgress();
    if (refreshStandards) {
      refreshStandards();
    }
  }, [refreshProgress, refreshStandards]);

  const handleEdit = useCallback((standardId: string) => {
    if (onEditStandard) {
      onEditStandard(standardId);
    }
  }, [onEditStandard]);

  const handleDeactivate = useCallback(async (standardId: string) => {
    try {
      await archiveStandard(standardId);
    } catch (err) {
      Alert.alert('Error', 'Failed to deactivate standard');
      console.error('Failed to deactivate standard:', err);
    }
  }, [archiveStandard]);

  const handleCardPress = useCallback((standardId: string) => {
    // Navigate to current period logs for active standards
    navigation.navigate('StandardPeriodActivityLogs', {
      standardId,
      // No period boundaries - will calculate current period
    });
  }, [navigation]);

  // Calculate counts for chips
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    dashboardStandards.forEach((entry) => {
      const categoryId = getEffectiveCategoryId(entry);
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    });
    return { counts, total: dashboardStandards.length };
  }, [dashboardStandards, getEffectiveCategoryId]);

  const handleFilterTabPress = useCallback(
    (categoryId: string | null) => {
      setFocusedCategoryId(categoryId);
    },
    [setFocusedCategoryId]
  );

  const filterTabs = useMemo(() => {
    const tabs: Array<{
      key: string;
      categoryId: string | null;
      label: string;
      accessibilityLabel: string;
    }> = [];

    const uncategorizedCount = categoryCounts.counts.get(UNCATEGORIZED_CATEGORY_ID) ?? 0;
    tabs.push({
      key: UNCATEGORIZED_CATEGORY_ID,
      categoryId: UNCATEGORIZED_CATEGORY_ID,
      label: `Uncategorized (${uncategorizedCount})`,
      accessibilityLabel: `Uncategorized, ${uncategorizedCount} standards`,
    });

    customCategories.forEach((category) => {
      const count = categoryCounts.counts.get(category.id) ?? 0;
      tabs.push({
        key: category.id,
        categoryId: category.id,
        label: `${category.name} (${count})`,
        accessibilityLabel: `${category.name} category, ${count} standards`,
      });
    });

    tabs.push({
      key: '__all__',
      categoryId: null,
      label: `All (${categoryCounts.total})`,
      accessibilityLabel: `All standards, ${categoryCounts.total} total`,
    });

    return tabs;
  }, [categoryCounts.counts, categoryCounts.total, customCategories]);

  const selectedFilterTabKey = focusedCategoryId ?? '__all__';

  const sortLabel = sortOption === 'completion' ? 'Completion' : 'Alpha';

  const closeHeaderMenu = useCallback(() => {
    setHeaderMenuVisible(false);
    setSortMenuExpanded(false);
  }, []);

  // Keep the selected tab in view (same behavior as chart tabs).
  useEffect(() => {
    const layout = filterTabLayouts.current[selectedFilterTabKey];
    if (layout && filterTabsScrollRef.current) {
      filterTabsScrollRef.current.scrollTo({
        x: layout.x - 16,
        animated: true,
      });
    }
  }, [selectedFilterTabKey]);

  const handleCategorizePress = useCallback(() => {
    navigation.navigate(
      SETTINGS_TAB_ROUTE_NAME as any,
      { screen: 'Categories', params: { backTo: 'Dashboard' } } as any
    );
  }, [navigation]);

  const handleCardCategorize = useCallback(
    (entry: DashboardStandard) => {
      const activityName = activityNameMap.get(entry.standard.activityId) ?? entry.standard.activityId;

      if (!hasCustomCategories) {
        trackStandardEvent('dashboard_categorize_missing_categories', {
          standardId: entry.standard.id,
          activityId: entry.standard.activityId,
        });
        handleCategorizePress();
        return;
      }

      const options = [
        { text: 'Cancel', style: 'cancel' as const },
        ...customCategories.map((category) => ({
          text: category.name,
          onPress: async () => {
            try {
              trackStandardEvent('dashboard_categorize_assign', {
                standardId: entry.standard.id,
                activityId: entry.standard.activityId,
                categoryId: category.id,
              });
              await updateActivity(entry.standard.activityId, { categoryId: category.id });
            } catch (err) {
              Alert.alert('Error', 'Failed to assign category');
              console.error('Failed to assign category:', err);
            }
          },
        })),
        {
          text: 'Uncategorized',
          onPress: async () => {
            try {
              trackStandardEvent('dashboard_categorize_assign', {
                standardId: entry.standard.id,
                activityId: entry.standard.activityId,
                categoryId: UNCATEGORIZED_CATEGORY_ID,
              });
              await updateActivity(entry.standard.activityId, { categoryId: null });
            } catch (err) {
              Alert.alert('Error', 'Failed to assign category');
              console.error('Failed to assign category:', err);
            }
          },
        },
      ];

      Alert.alert('Categorize', `Assign "${activityName}" to a category:`, options);
    },
    [activityNameMap, customCategories, handleCategorizePress, hasCustomCategories, updateActivity]
  );

  const handleAssignCategory = useCallback(
    async (entry: DashboardStandard, categoryId: string) => {
      const activityName = activityNameMap.get(entry.standard.activityId) ?? entry.standard.activityId;
      try {
        trackStandardEvent('dashboard_categorize_assign', {
          standardId: entry.standard.id,
          activityId: entry.standard.activityId,
          categoryId,
        });
        await updateActivity(entry.standard.activityId, {
          categoryId: categoryId === UNCATEGORIZED_CATEGORY_ID ? null : categoryId,
        });
      } catch (err) {
        Alert.alert('Error', `Failed to assign "${activityName}" to a category`);
        console.error('Failed to assign category:', err);
      }
    },
    [activityNameMap, updateActivity]
  );

  const renderCard = useCallback(
    ({ item }: { item: DashboardStandard }) => {
      return (
        <StandardCard
          entry={item}
          onLogPress={() => handleLogPress(item)}
          onCardPress={() => handleLogPress(item)}
          onViewLogs={() => handleCardPress(item.standard.id)}
          onCategorize={() => handleCardCategorize(item)}
          categorizeLabel={cardCategorizeLabel}
          categoryOptions={customCategories.map((c) => ({ id: c.id, name: c.name }))}
          selectedCategoryId={getEffectiveCategoryId(item)}
          onAssignCategoryId={(categoryId) => handleAssignCategory(item, categoryId)}
          onEdit={() => handleEdit(item.standard.id)}
          onDeactivate={() => handleDeactivate(item.standard.id)}
          activityNameMap={activityNameMap}
        />
      );
    },
    [
      cardCategorizeLabel,
      customCategories,
      getEffectiveCategoryId,
      handleAssignCategory,
      handleCardCategorize,
      handleCardPress,
      handleDeactivate,
      handleEdit,
      handleLogPress,
      activityNameMap,
    ]
  );

  const sortedAndFilteredStandards = useMemo(() => {
    const sortStandards = (a: DashboardStandard, b: DashboardStandard) => {
      if (sortOption === 'completion') {
        const aProgress = a.progress?.progressPercent ?? 0;
        const bProgress = b.progress?.progressPercent ?? 0;
        return aProgress - bProgress;
      }
      const aName = activityNameMap.get(a.standard.activityId) ?? a.standard.activityId;
      const bName = activityNameMap.get(b.standard.activityId) ?? b.standard.activityId;
      return aName.localeCompare(bName);
    };

    const base = dashboardStandards;
    const filtered =
      focusedCategoryId === null
        ? base
        : base.filter((entry) => getEffectiveCategoryId(entry) === focusedCategoryId);
    return [...filtered].sort(sortStandards);
  }, [activityNameMap, dashboardStandards, focusedCategoryId, getEffectiveCategoryId, sortOption]);

  const content = useMemo(() => {
    if (loading && dashboardStandards.length === 0) {
      return (
        <View style={styles.skeletonContainer} testID="dashboard-skeletons">
          {[0, 1, 2].map((key) => (
            <View key={key} style={[styles.skeletonCard, { backgroundColor: theme.background.card }]}>
              <View style={[styles.skeletonLine, { backgroundColor: theme.background.tertiary }]} />
              <View style={[styles.skeletonLineShort, { backgroundColor: theme.background.tertiary }]} />
              <View style={[styles.skeletonBar, { backgroundColor: theme.border.primary }]} />
            </View>
          ))}
        </View>
      );
    }

    if (dashboardStandards.length === 0) {
      return (
        <View style={styles.emptyContainer} testID="dashboard-empty-state">
          <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
            No active standards
          </Text>
          <TouchableOpacity
            onPress={onLaunchBuilder}
            style={[styles.builderButton, { backgroundColor: theme.button.primary.background }]}
            accessibilityRole="button"
          >
            <Text style={[styles.builderButtonText, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.button.primary.text }]}>Create Standard</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        testID="dashboard-list"
        data={sortedAndFilteredStandards}
        renderItem={renderCard}
        keyExtractor={(item) => item.standard.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshProgress} />
        }
        ListEmptyComponent={
          <View style={styles.emptyFilteredContainer} testID="dashboard-empty-filter">
            <Text style={[styles.emptyFilteredText, { color: theme.text.secondary }]}>
              No standards in this category
            </Text>
            <TouchableOpacity
              onPress={() => setFocusedCategoryId(null)}
              style={[styles.clearFilterButton, { borderColor: theme.border.secondary }]}
              accessibilityRole="button"
              accessibilityLabel="Show all standards"
            >
              <Text style={[styles.clearFilterButtonText, { color: theme.text.secondary }]}>
                Show All
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    );
  }, [
    dashboardStandards,
    loading,
    onLaunchBuilder,
    refreshProgress,
    renderCard,
    setFocusedCategoryId,
    theme,
    sortedAndFilteredStandards,
  ]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background.screen }]}>
      <View style={[styles.header, { backgroundColor: theme.background.chrome, borderBottomColor: theme.border.secondary, paddingTop: Math.max(insets.top, 12) }]}>
        {backButtonLabel ? (
          <TouchableOpacity onPress={onBack} accessibilityRole="button">
            <Text style={[styles.backButton, { color: theme.primary.main }]}>{backButtonLabel}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Active Standards</Text>
        <TouchableOpacity
          onPress={() => setHeaderMenuVisible(true)}
          style={styles.headerMenuButton}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <MaterialIcons name="more-vert" size={24} color={theme.button.icon.icon} />
        </TouchableOpacity>
      </View>

      {/* Focus Tabs Row */}
      {dashboardStandards.length > 0 && hasCustomCategories && (
        <View
          style={[
            styles.filterTabsContainer,
            {
              backgroundColor: theme.background.chrome,
              borderBottomColor: theme.border.secondary,
            },
          ]}
        >
          <ScrollView
            ref={filterTabsScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsScrollContent}
          >
            {filterTabs.map((tab) => {
              const isSelected = (tab.categoryId ?? '__all__') === selectedFilterTabKey;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onLayout={(event) => {
                    filterTabLayouts.current[tab.key] = event.nativeEvent.layout;
                    // If this is the selected tab, snap to it immediately (no animation)
                    if (tab.key === selectedFilterTabKey) {
                      filterTabsScrollRef.current?.scrollTo({
                        x: event.nativeEvent.layout.x - 16,
                        animated: false,
                      });
                    }
                  }}
                  style={[
                    styles.filterTab,
                    isSelected && {
                      borderBottomColor: theme.tabBar.activeTint,
                      borderBottomWidth: 3,
                    },
                  ]}
                  onPress={() => handleFilterTabPress(tab.categoryId)}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={tab.accessibilityLabel}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: isSelected ? theme.tabBar.activeTint : theme.text.secondary },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Header Kebab Menu */}
      {headerMenuVisible && (
        <TouchableOpacity
          style={[
            styles.menuOverlay,
            { paddingTop: Math.max(insets.top, 12) + 44 },
          ]}
          activeOpacity={1}
          onPress={closeHeaderMenu}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        >
          <View style={[styles.menuContainer, { backgroundColor: theme.background.modal, borderColor: theme.border.secondary }]}>
            <TouchableOpacity
              onPress={() => setSortMenuExpanded((prev) => !prev)}
              style={styles.menuSectionHeader}
              accessibilityRole="button"
              accessibilityLabel="Sort"
            >
              <Text style={[styles.menuSectionTitle, { color: theme.button.primary.background }]}>Sort</Text>
              <View style={styles.menuSectionRight}>
                <Text style={[styles.menuSectionValue, { color: theme.button.primary.background }]}>{sortLabel}</Text>
                <MaterialIcons
                  name={sortMenuExpanded ? 'expand-more' : 'chevron-right'}
                  size={22}
                  color={theme.button.primary.background}
                />
              </View>
            </TouchableOpacity>

            {sortMenuExpanded && (
              <View
                style={[
                  styles.menuSectionBody,
                  {
                    backgroundColor: theme.background.surface,
                    borderTopColor: theme.border.secondary,
                    borderBottomColor: theme.border.secondary,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    setSortOption('completion');
                    closeHeaderMenu();
                  }}
                  style={styles.submenuItem}
                  accessibilityRole="button"
                  accessibilityLabel="Sort by completion percentage"
                >
                  <Text style={[styles.menuItemText, { color: theme.button.primary.background }]}>Completion</Text>
                  {sortOption === 'completion' && (
                    <MaterialIcons name="check" size={20} color={theme.button.primary.background} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setSortOption('alpha');
                    closeHeaderMenu();
                  }}
                  style={styles.submenuItem}
                  accessibilityRole="button"
                  accessibilityLabel="Sort alphabetically"
                >
                  <Text style={[styles.menuItemText, { color: theme.button.primary.background }]}>Alpha</Text>
                  {sortOption === 'alpha' && (
                    <MaterialIcons name="check" size={20} color={theme.button.primary.background} />
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.menuDivider, { backgroundColor: theme.border.secondary }]} />

            <TouchableOpacity
              onPress={() => {
                closeHeaderMenu();
                handleCategorizePress();
              }}
              style={styles.menuActionItem}
              accessibilityRole="button"
              accessibilityLabel="Manage Categories"
            >
              <Text style={[styles.menuItemText, { color: theme.button.primary.background }]}>Manage Categories</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      <ErrorBanner error={error} onRetry={handleRetry} />

      {content}

      <LogEntryModal
        visible={logModalVisible}
        standard={selectedStandard}
        onClose={handleLogModalClose}
        onSave={handleLogSave}
        resolveActivityName={(activityId) => activityNameMap.get(activityId)}
      />
    </View>
  );
}

function StandardCard({
  entry,
  onLogPress,
  onCardPress,
  onViewLogs,
  categorizeLabel,
  onCategorize,
  categoryOptions,
  selectedCategoryId,
  onAssignCategoryId,
  onEdit,
  onDeactivate,
  activityNameMap,
}: {
  entry: DashboardStandard;
  onLogPress: () => void;
  onCardPress?: () => void;
  onViewLogs?: () => void;
  categorizeLabel?: string;
  onCategorize?: () => void;
  categoryOptions?: Array<{ id: string; name: string }>;
  selectedCategoryId?: string;
  onAssignCategoryId?: (categoryId: string) => void | Promise<void>;
  onEdit?: () => void;
  onDeactivate?: () => void;
  activityNameMap: Map<string, string>;
}) {
  const { standard, progress } = entry;
  
  // Get activity name from map, fallback to activityId if not found
  const activityName = activityNameMap.get(standard.activityId) ?? standard.activityId;
  
  // Use period label from progress (computed with windowReferenceMs for auto-advance)
  // Fallback to empty string if progress is null (shouldn't happen in normal flow)
  const periodLabel = progress?.periodLabel ?? '';
  
  // Get numeric summaries
  const currentTotal = progress?.currentTotal ?? 0;
  const targetValue = progress?.targetValue ?? standard.minimum;
  const currentTotalFormatted = progress?.currentTotalFormatted ?? '0';
  const targetValueFormatted = Math.round(targetValue).toString();
  
  const currentSessions = progress?.currentSessions ?? 0;
  const targetSessions = progress?.targetSessions ?? standard.sessionConfig.sessionsPerCadence;
  const sessionLabel = standard.sessionConfig.sessionLabel;
  
  const status = progress?.status ?? 'In Progress';
  const progressPercent = progress?.progressPercent ?? 0;

  return (
    <StandardProgressCard
      standard={standard}
      activityName={activityName}
      periodLabel={periodLabel}
      currentTotal={currentTotal}
      currentTotalFormatted={currentTotalFormatted}
      targetValue={targetValue}
      targetValueFormatted={targetValueFormatted}
      progressPercent={progressPercent}
      status={status}
      currentSessions={currentSessions}
      targetSessions={targetSessions}
      sessionLabel={sessionLabel}
      unit={standard.unit}
      variant="compact"
      showStatusPill={false}
      onLogPress={onLogPress}
      onCardPress={onCardPress}
      onViewLogs={onViewLogs}
      categorizeLabel={categorizeLabel}
      onCategorize={onCategorize}
      categoryOptions={categoryOptions}
      selectedCategoryId={selectedCategoryId}
      onAssignCategoryId={onAssignCategoryId}
      onEdit={onEdit}
      onDeactivate={onDeactivate}
    />
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
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 64,
  },
  headerMenuButton: {
    width: 64,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 16,
    zIndex: 1000,
    elevation: 1000,
  },
  menuContainer: {
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 220,
    maxWidth: 280,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  menuSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuSectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 12,
  },
  menuSectionValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  menuSectionBody: {
    paddingBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  submenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingLeft: 28,
  },
  menuActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    opacity: 0.6,
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
  skeletonBar: {
    height: 4,
    borderRadius: 4,
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
    gap: CARD_VERTICAL_GAP,
  },
  emptyFilteredContainer: {
    paddingTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  emptyFilteredText: {
    fontSize: 14,
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  clearFilterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  filterTabsScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: CARD_SPACING,
    paddingRight: 16,
    flex: 1,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: -1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
