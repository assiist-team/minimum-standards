import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from 'react-native';
import type { Standard } from '@minimum-standards/shared-model';
import { calculatePeriodWindow } from '@minimum-standards/shared-model';
import { useStandardHistory } from '../hooks/useStandardHistory';
import { useStandards } from '../hooks/useStandards';
import { LogEntryModal } from '../components/LogEntryModal';
import { PeriodLogsModal } from '../components/PeriodLogsModal';
import { PeriodHistoryList } from '../components/PeriodHistoryList';
import type { PeriodHistoryEntry } from '../utils/standardHistory';
import { trackStandardEvent } from '../utils/analytics';
import { ErrorBanner } from '../components/ErrorBanner';

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

export interface StandardDetailScreenProps {
  standardId: string;
  onBack: () => void;
  onEdit: (standard: Standard) => void;
  onArchive: (standardId: string) => void;
}

export function StandardDetailScreen({
  standardId,
  onBack,
  onEdit,
  onArchive,
}: StandardDetailScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<{
    startMs: number;
    endMs: number;
    label: string;
  } | null>(null);

  const {
    standards,
    createLogEntry,
    updateLogEntry,
    archiveStandard,
    unarchiveStandard,
  } = useStandards();
  const standard = useMemo(
    () => standards.find((s) => s.id === standardId) ?? null,
    [standards, standardId]
  );

  const { history, loading, error, refresh } = useStandardHistory(standardId);

  // Track screen view on mount
  useEffect(() => {
    if (standard) {
      try {
        trackStandardEvent('standard_detail_view', {
          standardId: standard.id,
          activityId: standard.activityId,
        });
      } catch (err) {
        // Fail silently - analytics should not crash the app
        console.warn('Analytics tracking failed:', err);
      }
    }
  }, [standard?.id, standard?.activityId]);

  // Compute current period progress
  const currentPeriodProgress = useMemo(() => {
    if (!standard || history.length === 0) {
      return null;
    }
    // First entry in history is the current period (most recent)
    return history[0];
  }, [standard, history]);

  const handleLogPress = useCallback(() => {
    if (standard) {
      try {
        trackStandardEvent('standard_detail_log_tap', {
          standardId: standard.id,
          activityId: standard.activityId,
        });
      } catch (err) {
        // Fail silently - analytics should not crash the app
        console.warn('Analytics tracking failed:', err);
      }
    }
    setLogModalVisible(true);
  }, [standard]);

  const handleLogSave = useCallback(
    async (logStandardId: string, value: number, occurredAtMs: number, note?: string | null, logEntryId?: string) => {
      if (logEntryId && updateLogEntry) {
        // Edit mode: use updateLogEntry
        await updateLogEntry({ logEntryId, standardId: logStandardId, value, occurredAtMs, note });
      } else {
        // Create mode: use createLogEntry
        await createLogEntry({ standardId: logStandardId, value, occurredAtMs, note });
      }
      // History will update automatically via subscription
    },
    [createLogEntry, updateLogEntry]
  );

  const handleLogModalClose = useCallback(() => {
    setLogModalVisible(false);
  }, []);

  const handlePeriodPress = useCallback(
    (entry: PeriodHistoryEntry) => {
      if (standard) {
        try {
          trackStandardEvent('standard_detail_period_tap', {
            standardId: standard.id,
            periodLabel: entry.periodLabel,
          });
        } catch (err) {
          // Fail silently - analytics should not crash the app
          console.warn('Analytics tracking failed:', err);
        }
      }
      setSelectedPeriod({
        startMs: entry.periodStartMs,
        endMs: entry.periodEndMs,
        label: entry.periodLabel,
      });
    },
    [standard]
  );

  const handlePeriodModalClose = useCallback(() => {
    setSelectedPeriod(null);
  }, []);

  const handleEditPress = useCallback(() => {
    if (standard) {
      try {
        trackStandardEvent('standard_detail_edit_tap', {
          standardId: standard.id,
          activityId: standard.activityId,
        });
      } catch (err) {
        // Fail silently - analytics should not crash the app
        console.warn('Analytics tracking failed:', err);
      }
      onEdit(standard);
    }
  }, [standard, onEdit]);

  const handleArchivePress = useCallback(async () => {
    if (!standard) return;
    const action = standard.state === 'active' ? 'archive' : 'unarchive';
    try {
      trackStandardEvent('standard_detail_archive_tap', {
        standardId: standard.id,
        activityId: standard.activityId,
        action,
      });
    } catch (err) {
      // Fail silently - analytics should not crash the app
      console.warn('Analytics tracking failed:', err);
    }
    if (standard.state === 'active') {
      await archiveStandard(standardId);
    } else {
      await unarchiveStandard(standardId);
    }
    onArchive(standardId);
  }, [standard, standardId, archiveStandard, unarchiveStandard, onArchive]);

  const handleRetry = useCallback(() => {
    refresh();
  }, [refresh]);

  if (loading && history.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} accessibilityRole="button">
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Standard Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.skeletonContainer} testID="detail-skeleton">
          <View style={styles.skeletonCard}>
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLineShort} />
            <View style={styles.skeletonBar} />
          </View>
        </View>
      </View>
    );
  }

  if (!standard) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} accessibilityRole="button">
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Standard Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Standard not found</Text>
        </View>
      </View>
    );
  }

  const status = currentPeriodProgress?.status ?? 'In Progress';
  const colors = getStatusColors(isDark)[status] ?? getStatusColors(isDark)['In Progress'];
  const percent = currentPeriodProgress?.progressPercent ?? 0;
  
  // Compute period label if not available in currentPeriodProgress
  const periodLabel = currentPeriodProgress?.periodLabel ?? (() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
    const nowMs = Date.now();
    const window = calculatePeriodWindow(nowMs, standard.cadence, timezone);
    return window.label;
  })();
  
  const targetSummary = currentPeriodProgress?.targetSummary ?? standard.summary;
  const currentFormatted = currentPeriodProgress
    ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(
        currentPeriodProgress.total
      )
    : '—';

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} accessibilityRole="button">
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
          {standard.activityId}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ErrorBanner error={error} onRetry={handleRetry} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Current Period Summary */}
        <View style={[styles.currentPeriodCard, isDark && styles.currentPeriodCardDark]}>
          <View style={styles.currentPeriodHeader}>
            <Text style={[styles.periodLabel, isDark && styles.periodLabelDark]}>
              {periodLabel}
            </Text>
            <View
              style={[styles.statusPill, { backgroundColor: colors.background }]}
              accessibilityRole="text"
            >
              <Text style={[styles.statusText, { color: colors.text }]}>{status}</Text>
            </View>
          </View>
          <Text style={[styles.summaryText, isDark && styles.summaryTextDark]}>
            {currentFormatted} / {targetSummary}
          </Text>
          <View style={styles.progressSection}>
            <View style={[styles.progressBar, isDark && styles.progressBarDark]}>
              <View
                style={[styles.progressFill, { width: `${percent}%`, backgroundColor: colors.bar }]}
                accessibilityRole="progressbar"
                accessibilityValue={{ now: percent, min: 0, max: 100 }}
              />
            </View>
            <TouchableOpacity
              onPress={handleLogPress}
              style={styles.logButton}
              accessibilityRole="button"
              accessibilityLabel={`Log progress for ${standard.activityId}`}
            >
              <Text style={styles.logButtonText}>Log</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* History Section */}
        {history.length > 0 ? (
          <View style={styles.historySection}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>History</Text>
            <PeriodHistoryList
              history={history}
              onPeriodPress={handlePeriodPress}
            />
          </View>
        ) : (
          <View style={styles.emptyHistoryState}>
            <Text style={[styles.emptyHistoryText, isDark && styles.emptyHistoryTextDark]}>
              No history yet. Start logging to see your progress over time.
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            onPress={handleEditPress}
            style={[styles.actionButton, styles.editButton]}
            accessibilityRole="button"
            accessibilityLabel="Edit standard"
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleArchivePress}
            style={[styles.actionButton, styles.archiveButton]}
            accessibilityRole="button"
            accessibilityLabel={
              standard.state === 'active' ? 'Archive standard' : 'Unarchive standard'
            }
          >
            <Text style={styles.actionButtonText}>
              {standard.state === 'active' ? 'Archive' : 'Unarchive'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LogEntryModal
        visible={logModalVisible}
        standard={standard}
        onClose={handleLogModalClose}
        onSave={handleLogSave}
      />

      {selectedPeriod && (
        <PeriodLogsModal
          visible={true}
          standardId={standardId}
          periodStartMs={selectedPeriod.startMs}
          periodEndMs={selectedPeriod.endMs}
          periodLabel={selectedPeriod.label}
          onClose={handlePeriodModalClose}
        />
      )}
    </View>
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
    paddingHorizontal: 16,
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
  headerTitleDark: {
    color: '#E0E0E0',
  },
  headerSpacer: {
    width: 64,
  },
  skeletonContainer: {
    padding: 16,
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
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  currentPeriodCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  currentPeriodCardDark: {
    backgroundColor: '#1E1E1E',
  },
  currentPeriodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 14,
    color: '#5f6368',
    fontWeight: '500',
  },
  periodLabelDark: {
    color: '#B0B0B0',
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
  summaryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E1116',
  },
  summaryTextDark: {
    color: '#E0E0E0',
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
  historySection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  sectionTitleDark: {
    color: '#E0E0E0',
  },
  emptyHistoryState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyHistoryTextDark: {
    color: '#B0B0B0',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#f0f0f0',
  },
  archiveButton: {
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F62FE',
  },
});
