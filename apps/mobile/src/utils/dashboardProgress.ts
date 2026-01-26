import {
  Standard,
  formatStandardSummary,
  calculatePeriodWindow,
  derivePeriodStatus,
  PeriodStatus,
} from '@minimum-standards/shared-model';

export type DashboardLogSlice = {
  id: string;
  standardId: string;
  value: number;
  occurredAtMs: number;
};

export type DashboardProgress = {
  standardId: string;
  periodLabel: string;
  currentTotal: number;
  currentTotalFormatted: string;
  targetValue: number;
  targetSummary: string;
  progressPercent: number;
  status: PeriodStatus;
  currentSessions: number;
  targetSessions: number;
  periodStartMs: number;
  periodEndMs: number;
};

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

export function buildDashboardProgressMap(params: {
  standards: Standard[];
  logs: DashboardLogSlice[];
  timezone: string;
  nowMs?: number;
  windowReferenceMs?: number;
}): Record<string, DashboardProgress> {
  const {
    standards,
    logs,
    timezone,
    nowMs = Date.now(),
    windowReferenceMs,
  } = params;

  if (standards.length === 0) {
    return {};
  }

  const progressMap: Record<string, DashboardProgress> = {};

  standards.forEach((standard) => {
    const referenceTimestamp = windowReferenceMs ?? nowMs;
    const window = calculatePeriodWindow(
      referenceTimestamp,
      standard.cadence,
      timezone,
      { periodStartPreference: standard.periodStartPreference }
    );
    const windowLogs = logs.filter(
      (log) =>
        log.standardId === standard.id &&
        log.occurredAtMs >= window.startMs &&
        log.occurredAtMs < window.endMs
    );

    const currentTotal = windowLogs.reduce((sum, log) => sum + log.value, 0);
    const currentSessions = windowLogs.length;
    const targetSessions = standard.sessionConfig.sessionsPerCadence;
    const status = derivePeriodStatus(currentTotal, standard.minimum, nowMs, window.endMs);
    const safeMinimum = Math.max(standard.minimum, 0);
    const ratio = safeMinimum === 0 ? 1 : Math.min(currentTotal / safeMinimum, 1);

    progressMap[standard.id] = {
      standardId: standard.id,
      periodLabel: window.label,
      currentTotal,
      currentTotalFormatted: numberFormatter.format(currentTotal),
      targetValue: safeMinimum,
      targetSummary: formatStandardSummary(
        standard.minimum,
        standard.unit,
        standard.cadence,
        standard.sessionConfig
      ),
      progressPercent: Number((ratio * 100).toFixed(2)),
      status,
      currentSessions,
      targetSessions,
      periodStartMs: window.startMs,
      periodEndMs: window.endMs,
    };
  });

  return progressMap;
}
