import { StandardCadence, TimestampMs } from './types';
export type PeriodStatus = 'Met' | 'In Progress' | 'Missed';
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
export declare function calculatePeriodWindow(timestampMs: TimestampMs, cadence: StandardCadence, timezone: string): PeriodWindow;
/**
 * Derives the period status from period totals and boundaries.
 *
 * @param periodTotal - The total value for the period
 * @param minimum - The minimum required value
 * @param nowMs - Current timestamp in milliseconds
 * @param periodEndMs - Period end boundary (exclusive) in milliseconds
 * @returns Period status: 'Met', 'In Progress', or 'Missed'
 */
export declare function derivePeriodStatus(periodTotal: number, minimum: number, nowMs: TimestampMs, periodEndMs: TimestampMs): PeriodStatus;
