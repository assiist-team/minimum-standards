import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import type { Standard } from '@minimum-standards/shared-model';
import { useActiveStandardsDashboard } from '../hooks/useActiveStandardsDashboard';
import type { DashboardStandard } from '../hooks/useActiveStandardsDashboard';
import { trackStandardEvent } from '../utils/analytics';
import { LogEntryModal } from '../components/LogEntryModal';

export interface ActiveStandardsDashboardScreenProps {
  onBack: () => void;
  onLaunchBuilder: () => void;
  onOpenLogModal?: (standard: Standard) => void;
  onNavigateToDetail?: (standardId: string) => void;
}

const STATUS_COLORS_LIGHT: Record<string, { background: string; text: string; bar: string }> = {
  Met: { background: '#E6F4EA', text: '#1E8E3E', bar: '#1E8E3E' },
  'In Progress': { background: '#FFF8E1', text: '#B06E00', bar: '#F4B400' },
  Missed: { background: '#FCE8E6', text: '#C5221F', bar: '#C5221F' },
};

const STATUS_COLORS_DARK: Record<string, { background: string; text: string; bar: string }> = {
  Met: { background: '#1E3A2E', text: '#4CAF50', bar: '#4CAF50' },
  'In Progress': { background: '#3E2E1A', text: '#FFC107', bar: '#FFC107' },
  Missed: { background: '#3E1E1E', text: '#EF5350', bar: '#EF5350' },
};

function getStatusColors(isDark: boolean) {
  return isDark ? STATUS_COLORS_DARK : STATUS_COLORS_LIGHT;
}

const CARD_SPACING = 16;

export function ActiveStandardsDashboardScreen({
  onBack,
  onLaunchBuilder,
  onOpenLogModal,
  onNavigateToDetail,
}: ActiveStandardsDashboardScreenProps) {
  const isDark = useColorScheme() === 'dark';
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
            <View key={key} style={styles.skeletonCard}>
              <View style={styles.skeletonLine} />
              <View style={styles.skeletonLineShort} />
              <View style={styles.skeletonBar} />
            </View>
          ))}
        </View>
      );
    }

    if (dashboardStandards.length === 0) {
      return (
        <View style={styles.emptyState} testID="dashboard-empty-state">
          <Text style={styles.emptyTitle}>No active standards yet</Text>
          <Text style={styles.emptySubtitle}>
            Pinned standards will appear here once you create them.
          </Text>
          <TouchableOpacity
            onPress={onLaunchBuilder}
            style={styles.builderButton}
            accessibilityRole="button"
          >
            <Text style={styles.builderButtonText}>Open Standards Builder</Text>
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
  ]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} accessibilityRole="button">
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Standards</Text>
        <View style={styles.headerSpacer} />
      </View>

      {error && (
        <View style={[styles.errorBanner, isDark && styles.errorBannerDark]}>
          <Text style={[styles.errorText, isDark && styles.errorTextDark]}>
            {error.message || 'Something went wrong'}
          </Text>
          <TouchableOpacity onPress={handleRetry}>
            <Text style={[styles.retryText, isDark && styles.retryTextDark]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

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
  const isDark = useColorScheme() === 'dark';
  const { standard, pinned, progress } = entry;
  const status = progress?.status ?? 'In Progress';
  const colors = getStatusColors(isDark)[status] ?? getStatusColors(isDark)['In Progress'];
  const percent = progress?.progressPercent ?? 0;
  const periodLabel = progress?.periodLabel ?? 'Current period';
  const targetSummary = progress?.targetSummary ?? standard.summary;
  const currentFormatted = progress?.currentTotalFormatted ?? '—';
  const detailLine = `${periodLabel} · ${currentFormatted} / ${targetSummary}`;

  return (
    <TouchableOpacity
      style={[styles.card, isDark && styles.cardDark]}
      onPress={onCardPress}
      activeOpacity={onCardPress ? 0.7 : 1}
      accessibilityRole={onCardPress ? 'button' : undefined}
      accessibilityLabel={onCardPress ? `View details for ${standard.activityId}` : undefined}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleBlock}>
          <Text
            style={[styles.activityName, isDark && styles.activityNameDark]}
            numberOfLines={1}
            accessibilityLabel={`Standard for activity ${standard.activityId}`}
          >
            {standard.activityId}
          </Text>
          <Text style={[styles.periodText, isDark && styles.periodTextDark]} numberOfLines={2}>
            {detailLine}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <View
            style={[styles.statusPill, { backgroundColor: colors.background }]}
            accessibilityRole="text"
          >
            <Text style={[styles.statusText, { color: colors.text }]}>
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
        <View style={[styles.progressBar, isDark && styles.progressBarDark]}>
          <View
            style={[styles.progressFill, { width: `${percent}%`, backgroundColor: colors.bar }]}
            accessibilityRole="progressbar"
            accessibilityValue={{ now: percent, min: 0, max: 100 }}
          />
        </View>
        <TouchableOpacity
          onPress={onLogPress}
          style={styles.logButton}
          accessibilityRole="button"
          accessibilityLabel={`Log progress for ${standard.activityId}`}
        >
          <Text style={styles.logButtonText}>Log</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_SPACING,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
  },
  backButton: {
    fontSize: 16,
    color: '#0F62FE',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  headerSpacer: {
    width: 64,
  },
  errorBanner: {
    backgroundColor: '#FDECEA',
    padding: 12,
    margin: CARD_SPACING,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerDark: {
    backgroundColor: '#3E1E1E',
  },
  errorText: {
    color: '#9B1C1C',
    flex: 1,
    marginRight: 12,
  },
  errorTextDark: {
    color: '#EF5350',
  },
  retryText: {
    color: '#0F62FE',
    fontWeight: '600',
  },
  retryTextDark: {
    color: '#64B5F6',
  },
  skeletonContainer: {
    padding: CARD_SPACING,
    gap: CARD_SPACING,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e0e2e9',
  },
  skeletonLineShort: {
    height: 16,
    width: '60%',
    borderRadius: 8,
    backgroundColor: '#e0e2e9',
  },
  skeletonBar: {
    height: 4,
    borderRadius: 4,
    backgroundColor: '#d0d4dd',
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
    color: '#111',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#5f6368',
    textAlign: 'center',
  },
  builderButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0F62FE',
    borderRadius: 8,
  },
  builderButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: CARD_SPACING,
    gap: CARD_SPACING,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#1E1E1E',
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
    color: '#0E1116',
  },
  activityNameDark: {
    color: '#E0E0E0',
  },
  periodText: {
    fontSize: 14,
    color: '#5f6368',
  },
  periodTextDark: {
    color: '#B0B0B0',
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
    backgroundColor: '#edeff2',
    borderRadius: 2,
  },
  progressBarDark: {
    backgroundColor: '#333',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  logButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0F62FE',
    borderRadius: 999,
  },
  logButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
