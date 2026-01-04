import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { Standard } from '@minimum-standards/shared-model';
import { useActiveStandardsDashboard } from '../hooks/useActiveStandardsDashboard';
import type { DashboardStandard } from '../hooks/useActiveStandardsDashboard';
import { useActivities } from '../hooks/useActivities';
import { useStandards } from '../hooks/useStandards';
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
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);
  
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

  const { activities } = useActivities();

  // Create activity lookup map for efficient name resolution
  const activityNameMap = useMemo(() => {
    const map = new Map<string, string>();
    activities.forEach((activity) => {
      map.set(activity.id, activity.name);
    });
    return map;
  }, [activities]);

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

  const sortedDashboardStandards = useMemo(() => {
    return [...dashboardStandards].sort((a, b) => {
      if (sortOption === 'completion') {
        // Sort by completion percentage ascending (lowest first)
        const aProgress = a.progress?.progressPercent ?? 0;
        const bProgress = b.progress?.progressPercent ?? 0;
        return aProgress - bProgress;
      } else {
        // Sort alphabetically by activity name
        const aName = activityNameMap.get(a.standard.activityId) ?? a.standard.activityId;
        const bName = activityNameMap.get(b.standard.activityId) ?? b.standard.activityId;
        return aName.localeCompare(bName);
      }
    });
  }, [dashboardStandards, sortOption, activityNameMap]);

  const renderCard = useCallback(
    ({ item }: { item: DashboardStandard }) => {
      return (
        <StandardCard
          entry={item}
          onLogPress={() => handleLogPress(item)}
          onCardPress={() => handleCardPress(item.standard.id)}
          onEdit={() => handleEdit(item.standard.id)}
          onDeactivate={() => handleDeactivate(item.standard.id)}
          activityNameMap={activityNameMap}
        />
      );
    },
    [handleLogPress, handleCardPress, handleEdit, handleDeactivate, activityNameMap]
  );

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
        data={sortedDashboardStandards}
        renderItem={renderCard}
        keyExtractor={(item) => item.standard.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshProgress} />
        }
      />
    );
  }, [
    dashboardStandards,
    loading,
    onLaunchBuilder,
    refreshProgress,
    renderCard,
    theme,
    sortedDashboardStandards,
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
          onPress={() => setSortDropdownVisible(true)}
          style={styles.sortButton}
          accessibilityRole="button"
          accessibilityLabel="Sort options"
        >
          <MaterialIcons name="swap-vert" size={20} color={theme.text.secondary} />
          <Text style={[styles.sortButtonText, { color: theme.text.secondary }]}>
            {sortOption === 'completion' ? 'Completion' : 'Alpha'}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={20} color={theme.text.secondary} />
        </TouchableOpacity>
      </View>

      <ErrorBanner error={error} onRetry={handleRetry} />

      {content}

      <LogEntryModal
        visible={logModalVisible}
        standard={selectedStandard}
        onClose={handleLogModalClose}
        onSave={handleLogSave}
        resolveActivityName={(activityId) => activityNameMap.get(activityId)}
      />

      {/* Sort Options Dropdown */}
      {sortDropdownVisible && (
        <TouchableOpacity
          style={[styles.dropdownOverlay, { paddingTop: Math.max(insets.top, 12) + 44 }]}
          activeOpacity={1}
          onPress={() => setSortDropdownVisible(false)}
        >
          <View style={[styles.dropdownContainer, { backgroundColor: theme.background.modal, borderColor: theme.border.secondary }]}>
            <TouchableOpacity
              onPress={() => {
                setSortOption('completion');
                setSortDropdownVisible(false);
              }}
              style={styles.dropdownItem}
              accessibilityRole="button"
              accessibilityLabel="Sort by completion percentage"
            >
              <Text style={[styles.dropdownItemText, { color: theme.text.primary }]}>
                Completion
              </Text>
              {sortOption === 'completion' && (
                <MaterialIcons name="check" size={20} color={theme.primary.main} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setSortOption('alpha');
                setSortDropdownVisible(false);
              }}
              style={styles.dropdownItem}
              accessibilityRole="button"
              accessibilityLabel="Sort alphabetically"
            >
              <Text style={[styles.dropdownItemText, { color: theme.text.primary }]}>
                Alpha
              </Text>
              {sortOption === 'alpha' && (
                <MaterialIcons name="check" size={20} color={theme.primary.main} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StandardCard({
  entry,
  onLogPress,
  onCardPress,
  onEdit,
  onDeactivate,
  activityNameMap,
}: {
  entry: DashboardStandard;
  onLogPress: () => void;
  onCardPress?: () => void;
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
      showLogButton={true}
      onLogPress={onLogPress}
      onCardPress={onCardPress}
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
  },
  headerSpacer: {
    width: 64,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BUTTON_BORDER_RADIUS,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  dropdownContainer: {
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
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
});
