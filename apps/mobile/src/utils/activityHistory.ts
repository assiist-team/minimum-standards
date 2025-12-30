import {
  Standard,
  calculatePeriodWindow,
  derivePeriodStatus,
  PeriodStatus,
} from '@minimum-standards/shared-model';
import { ActivityHistoryRow } from '../hooks/useActivityHistory';

export interface ActivityLogSlice {
  id: string;
  standardId: string;
  value: number;
  occurredAtMs: number;
}

export interface MergedActivityHistoryRow {
  standardId: string;
  periodStartMs: number;
  periodEndMs: number;
  periodLabel: string;
  periodKey?: string;
  standardSnapshot: ActivityHistoryRow['standardSnapshot'];
  total: number;
  currentSessions: number;
  targetSessions: number;
  status: PeriodStatus;
  progressPercent: number;
  isCurrentPeriod: boolean;
}

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

/**
 * Computes synthetic current period rows for active standards that reference the activity.
 */
export function computeSyntheticCurrentRows(params: {
  standards: Standard[];
  activityId: string;
  logs: ActivityLogSlice[];
  timezone: string;
  nowMs: number;
}): MergedActivityHistoryRow[] {
  const { standards, activityId, logs, timezone, nowMs } = params;

  const syntheticRows: MergedActivityHistoryRow[] = [];

  // Filter to only active standards that reference this activity
  const relevantStandards = standards.filter(
    (standard) =>
      standard.activityId === activityId &&
      standard.state === 'active' &&
      standard.archivedAtMs === null
  );

  for (const standard of relevantStandards) {
    const window = calculatePeriodWindow(
      nowMs,
      standard.cadence,
      timezone,
      { periodStartPreference: standard.periodStartPreference }
    );

    // Query logs within the current period window [startMs, nowMs)
    const periodLogs = logs.filter(
      (log) =>
        log.standardId === standard.id &&
        log.occurredAtMs >= window.startMs &&
        log.occurredAtMs < nowMs
    );

    const total = periodLogs.reduce((sum, log) => sum + log.value, 0);
    const currentSessions = periodLogs.length;
    const targetSessions = standard.sessionConfig.sessionsPerCadence;
    const status = derivePeriodStatus(total, standard.minimum, nowMs, window.endMs);
    const safeMinimum = Math.max(standard.minimum, 0);
    const ratio = safeMinimum === 0 ? 1 : Math.min(total / safeMinimum, 1);
    const progressPercent = Number((ratio * 100).toFixed(2));

    syntheticRows.push({
      standardId: standard.id,
      periodStartMs: window.startMs,
      periodEndMs: window.endMs,
      periodLabel: window.label,
      periodKey: window.periodKey,
      standardSnapshot: {
        minimum: standard.minimum,
        unit: standard.unit,
        cadence: standard.cadence,
        sessionConfig: standard.sessionConfig,
        periodStartPreference: standard.periodStartPreference,
      },
      total,
      currentSessions,
      targetSessions,
      status,
      progressPercent,
      isCurrentPeriod: true,
    });
  }

  return syntheticRows;
}

/**
 * Merges persisted rows with synthetic current rows, deduplicates by (standardId, periodStartMs),
 * and sorts by periodEndMs desc.
 */
export function mergeActivityHistoryRows(params: {
  persistedRows: ActivityHistoryRow[];
  syntheticRows: MergedActivityHistoryRow[];
}): MergedActivityHistoryRow[] {
  const { persistedRows, syntheticRows } = params;

  // Create a map to track which (standardId, periodStartMs) combinations we've seen
  const seenKeys = new Set<string>();
  const merged: MergedActivityHistoryRow[] = [];

  // First, add synthetic rows (current periods)
  for (const synthetic of syntheticRows) {
    const key = `${synthetic.standardId}__${synthetic.periodStartMs}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      merged.push(synthetic);
    }
  }

  // Then, add persisted rows (completed periods), skipping duplicates
  for (const persisted of persistedRows) {
    const key = `${persisted.standardId}__${persisted.periodStartMs}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      merged.push({
        standardId: persisted.standardId,
        periodStartMs: persisted.periodStartMs,
        periodEndMs: persisted.periodEndMs,
        periodLabel: persisted.periodLabel,
        periodKey: persisted.periodKey,
        standardSnapshot: persisted.standardSnapshot,
        total: persisted.total,
        currentSessions: persisted.currentSessions,
        targetSessions: persisted.targetSessions,
        status: persisted.status,
        progressPercent: persisted.progressPercent,
        isCurrentPeriod: false,
      });
    }
  }

  // Sort by periodEndMs desc (most recent first)
  merged.sort((a, b) => b.periodEndMs - a.periodEndMs);

  return merged;
}

/**
 * Formats a total value for display.
 */
export function formatTotal(total: number): string {
  return numberFormatter.format(total);
}


