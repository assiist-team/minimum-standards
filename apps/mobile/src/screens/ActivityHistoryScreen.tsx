import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Standard, formatStandardSummary } from '@minimum-standards/shared-model';
import { useActivityHistory } from '../hooks/useActivityHistory';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useActivityRangeLogs, ActivityLogSlice } from '../hooks/useActivityRangeLogs';
import { useStandards } from '../hooks/useStandards';
import { useActivities } from '../hooks/useActivities';
import { StandardProgressCard } from '../components/StandardProgressCard';
import { ActivityHistoryStatsPanel } from '../components/ActivityHistoryStatsPanel';
import { ActivityVolumeCharts } from '../components/ActivityVolumeCharts';
import { ErrorBanner } from '../components/ErrorBanner';
import { useTheme } from '../theme/useTheme';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { RangeFilterDrawer, TimeRange } from '../components/RangeFilterDrawer';
import {
  computeSyntheticCurrentRows,
  mergeActivityHistoryRows,
  formatTotal,
  MergedActivityHistoryRow,
} from '../utils/activityHistory';
import { aggregateDailyVolume, aggregateDailyProgress } from '../utils/activityCharts';

export interface ActivityHistoryScreenProps {
  activityId: string;
  onBack: () => void;
}

const CARD_SPACING = 16;

const TIME_RANGE_DAYS: Record<TimeRange, number | null> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  'All': null,
};

export function ActivityHistoryScreen({
  activityId,
  onBack,
}: ActivityHistoryScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  const nowMs = useMemo(() => Date.now(), [timeRange]);

  const scrollRef = useRef<ScrollView>(null);
  const cardPositions = useRef<Record<string, number>>({});

  const [timeRange, setTimeRange] = useState<TimeRange>('All');
  const [isRangeDrawerVisible, setIsRangeDrawerVisible] = useState(false);

  const { standards } = useStandards();
  const { activities } = useActivities();
  const { rows: persistedRows, loading: historyLoading, error: historyError } = useActivityHistory(activityId);

  // Get activity name
  const activity = useMemo(
    () => activities.find((a) => a.id === activityId) ?? null,
    [activities, activityId]
  );
  const activityName = activity?.name ?? activityId;
  const unit = activity?.unit ?? '';

  // Get all standards (active and inactive) that reference this activity
  const relevantStandards = useMemo(
    () => standards.filter((s) => s.activityId === activityId),
    [standards, activityId]
  );

  const relevantStandardIds = useMemo(
    () => relevantStandards.map(s => s.id),
    [relevantStandards]
  );

  const activeStandards = useMemo(
    () =>
      relevantStandards.filter((standard) => standard.state === 'active' && standard.archivedAtMs === null),
    [relevantStandards]
  );

  // Fetch logs for active standards
  const { logs: currentPeriodLogs, loading: logsLoading, error: logsError } = useActivityLogs(
    activityId,
    relevantStandards,
    timezone
  );

  // Fetch logs for range charts
  const rangeDays = TIME_RANGE_DAYS[timeRange];
  const requestedRangeStartMs = rangeDays ? nowMs - (rangeDays * 24 * 60 * 60 * 1000) : 0;
  const { logs: rangeLogs, loading: rangeLogsLoading } = useActivityRangeLogs(
    relevantStandardIds,
    requestedRangeStartMs,
    nowMs
  );

  // Compute synthetic current rows
  const syntheticRows = useMemo(() => {
    if (activeStandards.length === 0) {
      return [];
    }
    return computeSyntheticCurrentRows({
      standards: activeStandards,
      activityId,
      logs: currentPeriodLogs,
      timezone,
      nowMs,
    });
  }, [activeStandards, activityId, currentPeriodLogs, timezone, nowMs]);

  // Merge persisted and synthetic rows
  const mergedRows = useMemo(() => {
    return mergeActivityHistoryRows({
      persistedRows,
      syntheticRows,
      timezone,
    });
  }, [persistedRows, syntheticRows, timezone]);

  const effectiveRangeStartMs = useMemo(() => {
    if (timeRange !== 'All') {
      return requestedRangeStartMs;
    }

    const earliestPeriodStart = mergedRows.length
      ? mergedRows.reduce((min, row) => Math.min(min, row.periodStartMs), Number.POSITIVE_INFINITY)
      : Number.POSITIVE_INFINITY;

    const earliestLog = rangeLogs.length
      ? rangeLogs.reduce((min, log) => Math.min(min, log.occurredAtMs), Number.POSITIVE_INFINITY)
      : Number.POSITIVE_INFINITY;

    const candidate = Math.min(earliestPeriodStart, earliestLog);
    if (!isFinite(candidate)) {
      return requestedRangeStartMs;
    }
    return candidate;
  }, [timeRange, requestedRangeStartMs, mergedRows, rangeLogs]);

  // Filtered rows for charts + list based on timeRange (full period totals)
  // Period list includes any periods that overlap the selected range
  const filteredRowsForList = useMemo(() => {
    if (timeRange === 'All') return mergedRows;
    // Include periods that overlap with the selected range
    return mergedRows.filter(row => row.periodStartMs < nowMs && row.periodEndMs >= requestedRangeStartMs);
  }, [mergedRows, timeRange, requestedRangeStartMs, nowMs]);

  const logsByStandard = useMemo(() => {
    const map = new Map<string, ActivityLogSlice[]>();
    rangeLogs.forEach((log) => {
      if (!map.has(log.standardId)) {
        map.set(log.standardId, []);
      }
      map.get(log.standardId)!.push(log);
    });
    map.forEach((logs) => logs.sort((a, b) => a.occurredAtMs - b.occurredAtMs));
    return map;
  }, [rangeLogs]);

  const periodLogsMap = useMemo(() => {
    const map = new Map<number, ActivityLogSlice[]>();
    mergedRows.forEach((row) => map.set(row.periodStartMs, []));

    if (mergedRows.length === 0 || logsByStandard.size === 0) {
      return map;
    }

    const rowsByStandard = new Map<string, MergedActivityHistoryRow[]>();
    mergedRows.forEach((row) => {
      if (!rowsByStandard.has(row.standardId)) {
        rowsByStandard.set(row.standardId, []);
      }
      rowsByStandard.get(row.standardId)!.push(row);
    });

    rowsByStandard.forEach((rows, standardId) => {
      const logs = logsByStandard.get(standardId) ?? [];
      if (rows.length === 0 || logs.length === 0) {
        return;
      }
      rows.sort((a, b) => a.periodStartMs - b.periodStartMs);
      let rowIdx = 0;
      for (const log of logs) {
        while (rowIdx < rows.length && log.occurredAtMs >= rows[rowIdx].periodEndMs) {
          rowIdx += 1;
        }
        if (rowIdx >= rows.length) {
          break;
        }
        const row = rows[rowIdx];
        if (log.occurredAtMs >= row.periodStartMs) {
          map.get(row.periodStartMs)?.push(log);
        }
      }
    });

    return map;
  }, [logsByStandard, mergedRows]);

  const clippedRows = useMemo(() => {
    return filteredRowsForList
      .map((row) => {
        const overlapStart = timeRange === 'All'
          ? row.periodStartMs
          : Math.max(row.periodStartMs, requestedRangeStartMs);
        const overlapEnd = Math.min(row.periodEndMs, nowMs);
        if (overlapEnd <= overlapStart) {
          return null;
        }

        const logs = periodLogsMap.get(row.periodStartMs) ?? [];
        const clippedTotal = logs.reduce((sum, log) => {
          if (log.occurredAtMs >= overlapStart && log.occurredAtMs < overlapEnd) {
            return sum + log.value;
          }
          return sum;
        }, 0);

        return {
          row,
          clippedTotal,
          overlapStartMs: overlapStart,
          overlapEndMs: overlapEnd,
        };
      })
      .filter((entry): entry is {
        row: MergedActivityHistoryRow;
        clippedTotal: number;
        overlapStartMs: number;
        overlapEndMs: number;
      } => entry !== null);
  }, [filteredRowsForList, periodLogsMap, requestedRangeStartMs, nowMs, timeRange]);

  // Aggregate Stats Panel Data
  const stats = useMemo(() => {
    // We want to show stats if we have ANY logs, even if we don't have completed periods yet
    if (rangeLogs.length === 0 && clippedRows.length === 0) return null;

    // Total value should reflect ALL logs in the selected range, not just those mapped to period rows
    const totalValueRaw = rangeLogs.reduce((sum, log) => sum + log.value, 0);
    
    const completedRows = clippedRows.filter(entry => entry.row.status !== 'In Progress');
    const metCount = completedRows.filter(entry => entry.clippedTotal >= entry.row.standardSnapshot.minimum).length;
    const completedPeriods = completedRows.length;
    const percentMet = completedPeriods > 0 ? Math.round((metCount / completedPeriods) * 100) : 0;

    // Standard Change logic - use all mergedRows to find full history
    const standardsHistory = [...mergedRows]
      .reverse() // Oldest first
      .map(row => row.standardSnapshot.minimum)
      .filter((val, index, self) => index === 0 || val !== self[index - 1]);
    
    let standardChange = 'No changes yet';
    if (standardsHistory.length > 1) {
      const first = standardsHistory[0];
      const latest = standardsHistory[standardsHistory.length - 1];
      standardChange = `${formatTotal(first)} ➝ ${formatTotal(latest)}`;
    }

    return {
      totalValue: formatTotal(totalValueRaw),
      percentMet,
      countMet: `${metCount} / ${completedPeriods} periods`,
      standardChange,
      standardHistory: standardsHistory.reverse(), // For the drill-down, latest first
    };
  }, [mergedRows, clippedRows]);

  // Aggregate Chart Data
  const chartData = useMemo(() => {
    if (filteredRowsForList.length === 0) return null;

    const dailyVolume = aggregateDailyVolume(rangeLogs, effectiveRangeStartMs, nowMs, timezone);
    
    const dailyProgress = aggregateDailyProgress(
      rangeLogs,
      filteredRowsForList.map(r => ({ startMs: r.periodStartMs, endMs: r.periodEndMs, goal: r.standardSnapshot.minimum })),
      timezone
    );

    // Period Progress: show all filtered periods, not just last 15
    // For very long histories, consider pagination/lazy loading in the future
    const periodProgress = filteredRowsForList.slice().reverse().map(r => ({
      label: r.periodLabel,
      actual: r.total,
      goal: r.standardSnapshot.minimum,
      status: r.status,
      periodStartMs: r.periodStartMs,
    }));

    // Standards Progress: use actual standard change points, not just period labels
    // Build from deduplicated standard history with effective dates
    const standardsHistoryMap = new Map<number, number>(); // periodStartMs -> minimum
    filteredRowsForList.forEach(r => {
      const existing = standardsHistoryMap.get(r.periodStartMs);
      if (!existing || r.standardSnapshot.minimum !== existing) {
        standardsHistoryMap.set(r.periodStartMs, r.standardSnapshot.minimum);
      }
    });
    
    const standardsProgress = Array.from(standardsHistoryMap.entries())
      .sort((a, b) => a[0] - b[0]) // Sort by period start
      .map(([periodStartMs, value]) => {
        const row = filteredRowsForList.find(r => r.periodStartMs === periodStartMs);
        return {
          label: row?.periodLabel || new Date(periodStartMs).toLocaleDateString(),
          value,
          periodStartMs,
        };
      });

    return {
      dailyVolume,
      dailyProgress,
      periodProgress,
      standardsProgress,
    };
  }, [filteredRowsForList, rangeLogs, effectiveRangeStartMs, nowMs, timezone]);

  const loading = historyLoading || logsLoading || (rangeLogsLoading && mergedRows.length === 0);
  const error = historyError || logsError;

  // Handle period card press - navigate to period activity logs
  const handlePeriodPress = (row: MergedActivityHistoryRow) => {
    navigation.navigate('StandardPeriodActivityLogs', {
      standardId: row.standardId,
      periodStartMs: row.periodStartMs,
      periodEndMs: row.periodEndMs,
    });
  };

  const handleSelectPeriod = (periodStartMs: number) => {
    const y = cardPositions.current[periodStartMs.toString()];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: y - 10, animated: true });
    }
  };

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
      periodStartPreference: snapshot.periodStartPreference ?? undefined,
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
          {activityName}
        </Text>
        <TouchableOpacity 
          onPress={() => setIsRangeDrawerVisible(true)}
          style={[styles.rangeTrigger, { backgroundColor: theme.background.surface, borderColor: theme.border.primary }]}
        >
          <MaterialIcon name="event" size={16} color={theme.primary.main} />
          <Text style={[styles.rangeTriggerText, { color: theme.text.primary }]}>{timeRange}</Text>
        </TouchableOpacity>
      </View>

      <RangeFilterDrawer
        visible={isRangeDrawerVisible}
        onClose={() => setIsRangeDrawerVisible(false)}
        selectedRange={timeRange}
        onSelectRange={setTimeRange}
      />

      <ErrorBanner error={error} />

      {loading && mergedRows.length === 0 ? (
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
          ref={scrollRef}
          style={[styles.content, { backgroundColor: theme.background.screen }]}
          contentContainerStyle={[
            styles.contentContainer,
            {
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          {stats && (
            <ActivityHistoryStatsPanel
              totalValue={stats.totalValue}
              unit={unit}
              percentMet={stats.percentMet}
              countMet={stats.countMet}
              standardChange={stats.standardChange}
              standardHistory={stats.standardHistory}
              isLoading={loading}
              hasData={rangeLogs.length > 0 || clippedRows.length > 0}
            />
          )}

          {chartData && (
            <ActivityVolumeCharts
              dailyVolume={chartData.dailyVolume}
              dailyProgress={chartData.dailyProgress}
              periodProgress={chartData.periodProgress}
              standardsProgress={chartData.standardsProgress}
              unit={unit}
              onSelectPeriod={handleSelectPeriod}
            />
          )}

          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Period History</Text>

          {filteredRowsForList.map((row) => {
            const snapshotStandard = createStandardFromSnapshot(row.standardSnapshot, row.standardId);

            const targetValue = row.standardSnapshot.minimum;
            const targetValueFormatted = Math.round(targetValue).toString();
            const currentTotalFormatted = formatTotal(row.total);

            return (
              <View
                key={`${row.standardId}__${row.periodStartMs}`}
                onLayout={(e) => {
                  cardPositions.current[row.periodStartMs.toString()] = e.nativeEvent.layout.y;
                }}
              >
                <StandardProgressCard
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
                  onCardPress={() => handlePeriodPress(row)}
                />
              </View>
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
    paddingTop: CARD_SPACING,
    gap: CARD_SPACING,
  },
  rangeTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  rangeTriggerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
});

