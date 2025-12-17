import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
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
    pinStandard,
    unpinStandard,
    movePinnedStandard,
    pinOrder,
    createLogEntry,
    updateLogEntry,
    refreshStandards,
  } = useActiveStandardsDashboard();

  const handleLogPress = useCallback(
    (entry: DashboardStandard) => {
      trackStandardEvent('dashboard_log_tap', {
        standardId: entry.standard.id,
        activityId: entry.standard.activityId,
        pinned: entry.pinned,
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

  const handlePinToggle = useCallback(
    async (entry: DashboardStandard) => {
      const handler = entry.pinned ? unpinStandard : pinStandard;
      const wasPinned = entry.pinned;
      try {
        await handler(entry.standard.id);
        trackStandardEvent(
          wasPinned ? 'dashboard_unpin_standard' : 'dashboard_pin_standard',
          {
            standardId: entry.standard.id,
            activityId: entry.standard.activityId,
            pinned: !wasPinned,
          }
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to update pinned order';
        Alert.alert('Pin update failed', message);
      }
    },
    [pinStandard, unpinStandard]
  );

  const handleReorder = useCallback(
    async (entry: DashboardStandard, targetIndex: number) => {
      try {
        await movePinnedStandard(entry.standard.id, targetIndex);
        trackStandardEvent('dashboard_pin_standard', {
          standardId: entry.standard.id,
          activityId: entry.standard.activityId,
          action: 'reorder',
          targetIndex,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to reorder pins';
        Alert.alert('Reorder failed', message);
      }
    },
    [movePinnedStandard]
  );

  const handlePinLongPress = useCallback(
    (entry: DashboardStandard) => {
      const title = entry.pinned ? 'Pinned Standard' : 'Pin options';
      Alert.alert(title, entry.standard.summary, [
        {
          text: entry.pinned ? 'Unpin' : 'Pin to top',
          onPress: () => {
            if (entry.pinned) {
              handlePinToggle(entry).catch(() => undefined);
            } else {
              pinStandard(entry.standard.id).catch(() => undefined);
            }
          },
        },
        {
          text: 'Move to top',
          onPress: () => handleReorder(entry, 0),
        },
        {
          text: 'Move to bottom',
          onPress: () =>
            handleReorder(entry, Math.max(pinOrder.length - 1, 0)),
          style: 'default',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]);
    },
    [handlePinToggle, handleReorder, pinOrder.length, pinStandard]
  );

  const renderCard = useCallback(
    ({ item }: { item: DashboardStandard }) => (
      <StandardCard
        entry={item}
        onLogPress={() => handleLogPress(item)}
        onPinPress={() => handlePinToggle(item)}
        onPinLongPress={() => handlePinLongPress(item)}
        onCardPress={() => {
          if (onNavigateToDetail) {
            onNavigateToDetail(item.standard.id);
          }
        }}
      />
    ),
    [handleLogPress, handlePinLongPress, handlePinToggle, onNavigateToDetail]
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
        <View style={styles.emptyState} testID="dashboard-empty-state">
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No active standards yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
            Pinned standards will appear here once you create them.
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
  onPinPress,
  onPinLongPress,
  onCardPress,
}: {
  entry: DashboardStandard;
  onLogPress: () => void;
  onPinPress: () => void;
  onPinLongPress: () => void;
  onCardPress?: () => void;
}) {
  const theme = useTheme();
  const { standard, pinned, progress } = entry;
  const status = progress?.status ?? 'In Progress';
  const statusColors = getStatusColors(theme, status as 'Met' | 'In Progress' | 'Missed');
  const percent = progress?.progressPercent ?? 0;
  
  // Compute period label if not available in progress
  const periodLabel = progress?.periodLabel ?? (() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
    const nowMs = Date.now();
    const window = calculatePeriodWindow(nowMs, standard.cadence, timezone);
    return window.label;
  })();
  
  const targetSummary = progress?.targetSummary ?? standard.summary;
  const currentFormatted = progress?.currentTotalFormatted ?? '—';
  const detailLine = `${periodLabel} · ${currentFormatted} / ${targetSummary}`;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.background.card, shadowColor: theme.shadow }]}
      onPress={onCardPress}
      activeOpacity={onCardPress ? 0.7 : 1}
      accessibilityRole={onCardPress ? 'button' : undefined}
      accessibilityLabel={onCardPress ? `View details for ${standard.activityId}` : undefined}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleBlock}>
          <Text
            style={[styles.activityName, { color: theme.text.primary }]}
            numberOfLines={1}
            accessibilityLabel={`Standard for activity ${standard.activityId}`}
          >
            {standard.activityId}
          </Text>
          <Text style={[styles.periodText, { color: theme.text.secondary }]} numberOfLines={2}>
            {detailLine}
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
          <TouchableOpacity
            onPress={onPinPress}
            onLongPress={onPinLongPress}
            accessibilityRole="button"
            accessibilityLabel={
              pinned ? 'Unpin standard from dashboard' : 'Pin standard to top'
            }
            style={styles.pinHandle}
          >
            <Text style={styles.pinHandleText}>{pinned ? '📌' : '⋮'}</Text>
          </TouchableOpacity>
        </View>
      </View>

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
          accessibilityLabel={`Log progress for ${standard.activityId}`}
        >
          <Text style={[styles.logButtonText, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.button.primary.text }]}>Log</Text>
        </TouchableOpacity>
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
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
    padding: 16,
    gap: 12,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
  },
  periodText: {
    fontSize: 14,
  },
  headerActions: {
    alignItems: 'flex-end',
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
  pinHandle: {
    padding: 4,
  },
  pinHandleText: {
    fontSize: 18,
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
  logButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  logButtonText: {
    // fontSize and fontWeight come from typography.button.primary
  },
});
