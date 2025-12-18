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
import type { Standard } from '@minimum-standards/shared-model';
import { calculatePeriodWindow } from '@minimum-standards/shared-model';
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

const CARD_SPACING = 16;

export function ActiveStandardsDashboardScreen({
  onBack,
  onLaunchBuilder,
  onOpenLogModal,
  onNavigateToDetail,
  onEditStandard,
  backButtonLabel,
}: ActiveStandardsDashboardScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);
  const [logModalVisible, setLogModalVisible] = useState(false);
  
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

  const renderCard = useCallback(
    ({ item }: { item: DashboardStandard }) => {
      return (
        <StandardCard
          entry={item}
          onLogPress={() => handleLogPress(item)}
          onCardPress={() => {
            if (onNavigateToDetail) {
              onNavigateToDetail(item.standard.id);
            }
          }}
          onEdit={() => handleEdit(item.standard.id)}
          onDeactivate={() => handleDeactivate(item.standard.id)}
          activityNameMap={activityNameMap}
        />
      );
    },
    [handleLogPress, handleEdit, handleDeactivate, onNavigateToDetail, activityNameMap]
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
        data={dashboardStandards}
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
        <View style={styles.headerSpacer} />
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
  
  // Compute period window and ensure numeric date format
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  const nowMs = Date.now();
  const window = calculatePeriodWindow(nowMs, standard.cadence, timezone);
  const periodLabel = progress?.periodLabel ?? window.label;
  
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
    gap: CARD_SPACING,
  },
});
