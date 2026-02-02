import {
  Standard,
  formatStandardSummary,
  calculatePeriodWindow,
  derivePeriodStatus,
  PeriodStatus,
} from '@minimum-standards/shared-model';

export type PeriodHistoryLogSlice = {
  id: string;
  standardId: string;
  value: number;
  occurredAtMs: number;
};

export type PeriodHistoryEntry = {
  periodLabel: string;
  total: number;
  target: number;
  targetSummary: string;
  status: PeriodStatus;
  progressPercent: number;
  periodStartMs: number;
  periodEndMs: number;
  currentSessions: number;
  targetSessions: number;
};


/**
 * Computes all periods with logs for a standard, ordered most-recent-first.
 * Iterates backwards through periods until no logs are found.
 *
 * @param standard - The standard to compute history for
 * @param logs - Array of log entries for the standard
 * @param timezone - IANA timezone identifier
 * @param nowMs - Current timestamp in milliseconds
 * @returns Array of period summaries ordered most-recent-first
 */
export function computeStandardHistory(
  standard: Standard,
  logs: PeriodHistoryLogSlice[],
  timezone: string,
  nowMs: number = Date.now()
): PeriodHistoryEntry[] {
  if (logs.length === 0) {
    return [];
  }

  const history: PeriodHistoryEntry[] = [];
  const processedPeriods = new Set<string>();

  // Start from the current period and iterate backwards
  let referenceTimestamp = nowMs;
  const maxIterations = 1000; // Safety limit to prevent infinite loops
  let iterations = 0;

  // Find the earliest log timestamp to know when to stop iterating
  const earliestLogMs = logs.length > 0 
    ? Math.min(...logs.map((l) => l.occurredAtMs)) 
    : nowMs;

  while (iterations < maxIterations) {
    const window = calculatePeriodWindow(
      referenceTimestamp,
      standard.cadence,
      timezone,
      { periodStartPreference: standard.periodStartPreference }
    );
    const periodKey = window.periodKey;

    // Stop if we've gone past the earliest log (entire window is before the earliest log)
    if (window.endMs <= earliestLogMs) {
      break;
    }

    // Skip if we've already processed this period
    if (processedPeriods.has(periodKey)) {
      break;
    }
    processedPeriods.add(periodKey);

    // Find logs within this period window
    const periodLogs = logs.filter(
      (log) =>
        log.standardId === standard.id &&
        log.occurredAtMs >= window.startMs &&
        log.occurredAtMs < window.endMs
    );

    // Only include periods that have logs
    if (periodLogs.length > 0) {
      // Calculate period total
      const periodTotal = periodLogs.reduce((sum, log) => sum + log.value, 0);
      
      // Calculate session counts
      const currentSessions = periodLogs.length;
      const targetSessions = standard.sessionConfig.sessionsPerCadence;

      // Derive status for this period
      const status = derivePeriodStatus(periodTotal, standard.minimum, nowMs, window.endMs);

      // Calculate progress percent
      const safeMinimum = Math.max(standard.minimum, 0);
      const ratio = safeMinimum === 0 ? 1 : Math.min(periodTotal / safeMinimum, 1);
      const progressPercent = Number((ratio * 100).toFixed(2));

      // Add to history (append as we iterate backwards, so most recent is first)
      history.push({
        periodLabel: window.label,
        total: periodTotal,
        target: safeMinimum,
        targetSummary: formatStandardSummary(standard.minimum, standard.unit, standard.cadence, standard.sessionConfig),
        status,
        progressPercent,
        periodStartMs: window.startMs,
        periodEndMs: window.endMs,
        currentSessions,
        targetSessions,
      });
    }

    // Move to previous period by going back one period duration
    // Use the start of current period minus 1ms as reference for next period
    referenceTimestamp = window.startMs - 1;
    iterations++;
  }

  // History is already in most-recent-first order
  return history;
}
