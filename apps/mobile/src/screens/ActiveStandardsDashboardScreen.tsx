import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Standard } from '@minimum-standards/shared-model';
import { calculatePeriodWindow } from '@minimum-standards/shared-model';
import { useActiveStandardsDashboard } from '../hooks/useActiveStandardsDashboard';
import type { DashboardStandard } from '../hooks/useActiveStandardsDashboard';
import { useActivities } from '../hooks/useActivities';
import { trackStandardEvent } from '../utils/analytics';
import { LogEntryModal } from '../components/LogEntryModal';
import { ErrorBanner } from '../components/ErrorBanner';
import { useTheme } from '../theme/useTheme';
import { getStatusColors } from '../theme/colors';
import { typography } from '../theme/typography';

const CARD_SPACING = 16;

export function ActiveStandardsDashboardScreen({
  onBack,
  onLaunchBuilder,
  onOpenLogModal,
  onNavigateToDetail,
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


  const renderCard = useCallback(
    ({ item }: { item: DashboardStandard }) => (
      <StandardCard
        entry={item}
        onLogPress={() => handleLogPress(item)}
        onCardPress={() => {
          if (onNavigateToDetail) {
            onNavigateToDetail(item.standard.id);
          }
        }}
        activityNameMap={activityNameMap}
      />
    ),
    [handleLogPress, onNavigateToDetail, activityNameMap]
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
    <View style={[styles.screen, { backgroundColor: theme.background.primary }]}>
      <View style={[styles.header, { backgroundColor: theme.background.secondary, borderBottomColor: theme.border.secondary, paddingTop: Math.max(insets.top, 12) }]}>
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
      />
    </View>
  );
}

function StandardCard({
  entry,
  onLogPress,
  onCardPress,
  activityNameMap,
}: {
  entry: DashboardStandard;
  onLogPress: () => void;
  onCardPress?: () => void;
  activityNameMap: Map<string, string>;
}) {
  const theme = useTheme();
  const { standard, progress } = entry;
  const status = progress?.status ?? 'In Progress';
  const statusColors = getStatusColors(theme, status as 'Met' | 'In Progress' | 'Missed');
  const percent = progress?.progressPercent ?? 0;
  
  // Get activity name from map, fallback to activityId if not found
  const activityName = activityNameMap.get(standard.activityId) ?? standard.activityId;
  
  // Compute period window and ensure numeric date format
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  const nowMs = Date.now();
  const window = calculatePeriodWindow(nowMs, standard.cadence, timezone);
  // Use the numeric date format from calculatePeriodWindow (already numeric)
  const periodLabel = progress?.periodLabel ?? window.label;
  
  const targetSummary = progress?.targetSummary ?? standard.summary;
  const currentFormatted = progress?.currentTotalFormatted ?? '—';
  const dateLine = periodLabel;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.background.card, shadowColor: theme.shadow }]}
      onPress={onCardPress}
      activeOpacity={onCardPress ? 0.7 : 1}
      accessibilityRole={onCardPress ? 'button' : undefined}
      accessibilityLabel={onCardPress ? `View details for ${activityName}` : undefined}
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
              style={[styles.standardSummary, { color: theme.text.primary }]}
              numberOfLines={1}
              accessibilityLabel={`Standard: ${targetSummary}`}
            >
              {targetSummary}
            </Text>
            <Text 
              style={[styles.dateLine, { color: theme.text.secondary }]} 
              numberOfLines={1}
              accessibilityLabel={`Period: ${dateLine}`}
            >
              {dateLine}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <View
              style={[styles.statusPill, { backgroundColor: statusColors.background }]}
              accessibilityRole="text"
            >
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {status}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.progressContainer, { backgroundColor: theme.background.secondary, borderTopColor: theme.border.secondary }]}>
          <View style={styles.progressSection}>
            <View style={[styles.progressBar, { backgroundColor: theme.background.tertiary }]}>
              <View
                style={[styles.progressFill, { width: `${percent}%`, backgroundColor: statusColors.bar }]}
                accessibilityRole="progressbar"
                accessibilityValue={{ now: percent, min: 0, max: 100 }}
              />
            </View>
            <TouchableOpacity
              onPress={onLogPress}
              style={[styles.logButton, { backgroundColor: theme.button.primary.background }]}
              accessibilityRole="button"
              accessibilityLabel={`Log progress for ${activityName}`}
            >
              <Text style={[styles.logButtonText, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.button.primary.text }]}>Log</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.progressText, { color: theme.text.secondary }]}>
            {currentFormatted} / {targetSummary}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
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
    borderRadius: 8,
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
    gap: 6,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
  },
  standardSummary: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateLine: {
    fontSize: 13,
  },
  headerActions: {
    alignItems: 'flex-start',
    gap: 8,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 12,
  },
  progressContainer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  logButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  logButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
});
