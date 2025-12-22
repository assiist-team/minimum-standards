import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Standard, formatStandardSummary } from '@minimum-standards/shared-model';
import { useActivityHistory } from '../hooks/useActivityHistory';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useStandards } from '../hooks/useStandards';
import { useActivities } from '../hooks/useActivities';
import { StandardProgressCard } from '../components/StandardProgressCard';
import { ErrorBanner } from '../components/ErrorBanner';
import { useTheme } from '../theme/useTheme';
import {
  computeSyntheticCurrentRows,
  mergeActivityHistoryRows,
  formatTotal,
  MergedActivityHistoryRow,
} from '../utils/activityHistory';

export interface ActivityHistoryScreenProps {
  activityId: string;
  onBack: () => void;
}

const CARD_SPACING = 16;

export function ActivityHistoryScreen({
  activityId,
  onBack,
}: ActivityHistoryScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  const nowMs = Date.now();

  const { standards } = useStandards();
  const { activities } = useActivities();
  const { rows: persistedRows, loading: historyLoading, error: historyError } = useActivityHistory(activityId);

  // Get activity name
  const activity = useMemo(
    () => activities.find((a) => a.id === activityId) ?? null,
    [activities, activityId]
  );
  const activityName = activity?.name ?? activityId;

  // Get all standards (active and inactive) that reference this activity
  const relevantStandards = useMemo(
    () => standards.filter((s) => s.activityId === activityId),
    [standards, activityId]
  );

  // Get active standard IDs for fetching logs
  const activeStandardIds = useMemo(
    () =>
      relevantStandards
        .filter((s) => s.state === 'active' && s.archivedAtMs === null)
        .map((s) => s.id),
    [relevantStandards]
  );

  // Fetch logs for active standards
  const { logs, loading: logsLoading, error: logsError } = useActivityLogs(
    activityId,
    activeStandardIds
  );

  // Compute synthetic current rows
  const syntheticRows = useMemo(() => {
    if (activeStandardIds.length === 0) {
      return [];
    }
    return computeSyntheticCurrentRows({
      standards: relevantStandards.filter(
        (s) => s.state === 'active' && s.archivedAtMs === null
      ),
      activityId,
      logs,
      timezone,
      nowMs,
    });
  }, [relevantStandards, activityId, logs, timezone, nowMs, activeStandardIds]);

  // Merge persisted and synthetic rows
  const mergedRows = useMemo(() => {
    return mergeActivityHistoryRows({
      persistedRows,
      syntheticRows,
    });
  }, [persistedRows, syntheticRows]);

  const loading = historyLoading || logsLoading;
  const error = historyError || logsError;

  // Create a Standard-like object from snapshot for rendering
  const createStandardFromSnapshot = (
    snapshot: MergedActivityHistoryRow['standardSnapshot'],
    standardId: string
  ): Standard => {
    // Compute summary from snapshot data
    const summary = formatStandardSummary(
      snapshot.minimum,
      snapshot.unit,
      snapshot.cadence,
      snapshot.sessionConfig
    );
    
    return {
      id: standardId,
      activityId,
      minimum: snapshot.minimum,
      unit: snapshot.unit,
      cadence: snapshot.cadence,
      sessionConfig: snapshot.sessionConfig,
      state: 'active' as const,
      summary,
      archivedAtMs: null,
      createdAtMs: 0,
      updatedAtMs: 0,
      deletedAtMs: null,
    };
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background.screen }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.background.chrome,
            borderBottomColor: theme.border.secondary,
            paddingTop: Math.max(insets.top, 12),
          },
        ]}
      >
        <TouchableOpacity onPress={onBack} accessibilityRole="button">
          <Text style={[styles.backButton, { color: theme.primary.main }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
          {activityName} History
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ErrorBanner error={error} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.activityIndicator} />
        </View>
      ) : mergedRows.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
            No history yet. Period rows appear after the next cadence boundary.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={[styles.content, { backgroundColor: theme.background.screen }]}
          contentContainerStyle={[
            styles.contentContainer,
            {
              paddingBottom: 16,
            },
          ]}
        >
          {mergedRows.map((row) => {
            const snapshotStandard = createStandardFromSnapshot(row.standardSnapshot, row.standardId);

            const targetValue = row.standardSnapshot.minimum;
            const targetValueFormatted = Math.round(targetValue).toString();
            const currentTotalFormatted = formatTotal(row.total);

            return (
              <StandardProgressCard
                key={`${row.standardId}__${row.periodStartMs}`}
                standard={snapshotStandard}
                activityName={activityName}
                periodLabel={row.isCurrentPeriod ? `${row.periodLabel} (In Progress)` : row.periodLabel}
                currentTotal={row.total}
                currentTotalFormatted={currentTotalFormatted}
                targetValue={targetValue}
                targetValueFormatted={targetValueFormatted}
                progressPercent={row.progressPercent}
                status={row.status}
                currentSessions={row.currentSessions}
                targetSessions={row.targetSessions}
                sessionLabel={row.standardSnapshot.sessionConfig.sessionLabel}
                unit={row.standardSnapshot.unit}
                showLogButton={false}
              />
            );
          })}
        </ScrollView>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60, // Match back button width for centering
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
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: CARD_SPACING,
    gap: CARD_SPACING,
  },
});

