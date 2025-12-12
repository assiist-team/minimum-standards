import { DateTime } from 'luxon';
import { StandardCadence, TimestampMs } from './types';

export type PeriodStatus = 'Met' | 'In Progress' | 'Missed';

export type PeriodWindow = {
  startMs: TimestampMs;
  endMs: TimestampMs;
  periodKey: string;
  label: string;
};

const LABEL_LOCALE = 'en-US';

function formatLabel(dt: DateTime, format: string): string {
  return dt.setLocale(LABEL_LOCALE).toFormat(format);
}

/**
 * Calculates the period window for a given timestamp, cadence, and timezone.
 * 
 * @param timestampMs - The timestamp in milliseconds
 * @param cadence - The cadence type (daily, weekly, monthly)
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns Period window with start (inclusive), end (exclusive), period key, and label
 */
export function calculatePeriodWindow(
  timestampMs: TimestampMs,
  cadence: StandardCadence,
  timezone: string
): PeriodWindow {
  const zoned = DateTime.fromMillis(timestampMs, { zone: timezone });

  if (!zoned.isValid) {
    throw new Error(`Invalid timestamp or timezone provided: ${zoned.invalidReason}`);
  }

  if (cadence === 'daily') {
    const start = zoned.startOf('day');
    const end = start.plus({ days: 1 });
    return {
      startMs: start.toMillis(),
      endMs: end.toMillis(),
      periodKey: start.toFormat('yyyy-LL-dd'),
      label: formatLabel(start, 'MMMM d, yyyy')
    };
  }

  if (cadence === 'weekly') {
    // Luxon weekday: Monday = 1, Sunday = 7
    const weekday = zoned.weekday;
    const daysToMonday = weekday === 1 ? 0 : weekday === 7 ? 6 : weekday - 1;
    const start = zoned.minus({ days: daysToMonday }).startOf('day');
    const end = start.plus({ weeks: 1 });
    return {
      startMs: start.toMillis(),
      endMs: end.toMillis(),
      periodKey: start.toFormat('yyyy-LL-dd'),
      label: `${formatLabel(start, 'MMMM d, yyyy')} - ${formatLabel(end.minus({ days: 1 }), 'MMMM d, yyyy')}`
    };
  }

  // Monthly cadence
  const monthStart = zoned.startOf('month');
  const monthEnd = monthStart.plus({ months: 1 });
  return {
    startMs: monthStart.toMillis(),
    endMs: monthEnd.toMillis(),
    periodKey: monthStart.toFormat('yyyy-LL'),
    label: formatLabel(monthStart, 'MMMM yyyy')
  };
}

/**
 * Derives the period status from period totals and boundaries.
 * 
 * @param periodTotal - The total value for the period
 * @param minimum - The minimum required value
 * @param nowMs - Current timestamp in milliseconds
 * @param periodEndMs - Period end boundary (exclusive) in milliseconds
 * @returns Period status: 'Met', 'In Progress', or 'Missed'
 */
export function derivePeriodStatus(
  periodTotal: number,
  minimum: number,
  nowMs: TimestampMs,
  periodEndMs: TimestampMs
): PeriodStatus {
  if (periodTotal >= minimum) {
    return 'Met';
  }
  
  if (nowMs >= periodEndMs) {
    return 'Missed';
  }
  
  return 'In Progress';
}

