import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useTheme } from '../theme/useTheme';
import { getStatusColors } from '../theme/colors';
import { typography } from '../theme/typography';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <View style={[styles.screen, { backgroundColor: theme.background.primary }]}>
        <View style={[styles.header, { backgroundColor: theme.background.secondary, borderBottomColor: theme.border.secondary }]}>
          <TouchableOpacity onPress={onBack} accessibilityRole="button">
            <Text style={[styles.backButton, { color: theme.primary.main }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Standard Details</Text>
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
      <View style={[styles.screen, { backgroundColor: theme.background.primary }]}>
        <View style={[styles.header, { backgroundColor: theme.background.secondary, borderBottomColor: theme.border.secondary }]}>
          <TouchableOpacity onPress={onBack} accessibilityRole="button">
            <Text style={[styles.backButton, { color: theme.primary.main }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Standard Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.text.secondary }]}>Standard not found</Text>
        </View>
      </View>
    );
  }

  const status = currentPeriodProgress?.status ?? 'In Progress';
  const statusColors = getStatusColors(theme, status as 'Met' | 'In Progress' | 'Missed');
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
    <View style={[styles.screen, { backgroundColor: theme.background.primary }]}>
      <View style={[styles.header, { backgroundColor: theme.background.secondary, borderBottomColor: theme.border.secondary, paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={onBack} accessibilityRole="button">
          <Text style={[styles.backButton, { color: theme.primary.main }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
          {standard.activityId}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ErrorBanner error={error} onRetry={handleRetry} />

      <ScrollView style={[styles.content, { backgroundColor: theme.background.primary }]} contentContainerStyle={styles.contentContainer}>
        {/* Current Period Summary */}
        <View style={[styles.currentPeriodCard, { backgroundColor: theme.background.card, shadowColor: theme.shadow }]}>
          <View style={styles.currentPeriodHeader}>
            <Text style={[styles.periodLabel, { color: theme.text.secondary }]}>
              {periodLabel}
            </Text>
            <View
              style={[styles.statusPill, { backgroundColor: statusColors.background }]}
              accessibilityRole="text"
            >
              <Text style={[styles.statusText, { color: statusColors.text }]}>{status}</Text>
            </View>
          </View>
          <Text style={[styles.summaryText, { color: theme.text.primary }]}>
            {currentFormatted} / {targetSummary}
          </Text>
          <View style={styles.progressSection}>
            <View style={[styles.progressBar, { backgroundColor: theme.background.tertiary }]}>
              <View
                style={[styles.progressFill, { width: `${percent}%`, backgroundColor: statusColors.bar }]}
                accessibilityRole="progressbar"
                accessibilityValue={{ now: percent, min: 0, max: 100 }}
              />
            </View>
            <TouchableOpacity
              onPress={handleLogPress}
              style={[styles.logButton, { backgroundColor: theme.button.primary.background }]}
              accessibilityRole="button"
              accessibilityLabel={`Log progress for ${standard.activityId}`}
            >
              <Text style={[styles.logButtonText, { fontSize: typography.button.primary.fontSize, fontWeight: typography.button.primary.fontWeight, color: theme.button.primary.text }]}>Log</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* History Section */}
        {history.length > 0 ? (
          <View style={styles.historySection}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>History</Text>
            <PeriodHistoryList
              history={history}
              onPeriodPress={handlePeriodPress}
            />
          </View>
        ) : (
          <View style={styles.emptyHistoryState}>
            <Text style={[styles.emptyHistoryText, { color: theme.text.secondary }]}>
              No history yet. Start logging to see your progress over time.
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            onPress={handleEditPress}
            style={[styles.actionButton, { backgroundColor: theme.button.secondary.background }]}
            accessibilityRole="button"
            accessibilityLabel="Edit standard"
          >
            <MaterialIcons name="edit" size={24} color={theme.primary.main} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleArchivePress}
            style={[styles.actionButton, { backgroundColor: theme.button.secondary.background }]}
            accessibilityRole="button"
            accessibilityLabel={
              standard.state === 'active' ? 'Archive standard' : 'Unarchive standard'
            }
          >
            <MaterialIcons 
              name={standard.state === 'active' ? 'archive' : 'unarchive'} 
              size={24} 
              color={theme.primary.main} 
            />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
    padding: 16,
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
  },
  emptyText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  currentPeriodCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  currentPeriodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '500',
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
  historySection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyHistoryState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 14,
    textAlign: 'center',
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
    justifyContent: 'center',
  },
});
