import { DateTime } from 'luxon';
import { StandardCadence, TimestampMs } from './types';

export type PeriodStatus = 'Met' | 'In Progress' | 'Missed';

const LABEL_LOCALE = 'en-US';

const formatLabel = (dt: DateTime, format: string) =>
  dt.setLocale(LABEL_LOCALE).toFormat(format);

export type PeriodWindow = {
  startMs: TimestampMs;
  endMs: TimestampMs;
  periodKey: string;
  label: string;
};

/**
 * Calculates the period window for a given timestamp, cadence, and timezone.
 * 
 * @param timestampMs - The timestamp in milliseconds
 * @param cadence - The cadence object with interval and unit
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

  const { interval, unit } = cadence;

  if (unit === 'day') {
    // For daily cadence, align to day start
    const start = zoned.startOf('day');
    const end = start.plus({ days: interval });
    const inclusiveEnd = end.minus({ days: 1 });
    return {
      startMs: start.toMillis(),
      endMs: end.toMillis(),
      periodKey: start.toFormat('yyyy-LL-dd'),
      label:
        interval === 1
          ? formatLabel(start, 'MMMM d, yyyy')
          : `${formatLabel(start, 'MMMM d, yyyy')} - ${formatLabel(
              inclusiveEnd,
              'MMMM d, yyyy'
            )}`,
    };
  }

  if (unit === 'week') {
    // For weekly cadence, align to Monday start
    // Luxon weekday: Monday = 1, Sunday = 7
    const weekday = zoned.weekday;
    const daysToMonday = weekday === 1 ? 0 : weekday === 7 ? 6 : weekday - 1;
    const start = zoned.minus({ days: daysToMonday }).startOf('day');
    const end = start.plus({ weeks: interval });
    const inclusiveEnd = end.minus({ days: 1 });
    return {
      startMs: start.toMillis(),
      endMs: end.toMillis(),
      periodKey: start.toFormat('yyyy-LL-dd'),
      label: `${formatLabel(start, 'MMMM d, yyyy')} - ${formatLabel(
        inclusiveEnd,
        'MMMM d, yyyy'
      )}`,
    };
  }

  // Monthly cadence
  if (unit === 'month') {
    const monthStart = zoned.startOf('month');
    const monthEnd = monthStart.plus({ months: interval });
    const inclusiveEnd = monthEnd.minus({ days: 1 });
    return {
      startMs: monthStart.toMillis(),
      endMs: monthEnd.toMillis(),
      periodKey: monthStart.toFormat('yyyy-LL'),
      label:
        interval === 1
          ? formatLabel(monthStart, 'MMMM yyyy')
          : `${formatLabel(monthStart, 'MMMM yyyy')} - ${formatLabel(
              inclusiveEnd,
              'MMMM yyyy'
            )}`,
    };
  }

  throw new Error(`Unsupported cadence unit: ${unit}`);
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

