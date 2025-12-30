import { StandardCadence, TimestampMs, PeriodStartPreference } from './types';
export type PeriodStatus = 'Met' | 'In Progress' | 'Missed';
export type PeriodWindow = {
    startMs: TimestampMs;
    endMs: TimestampMs;
    periodKey: string;
    label: string;
};
/**
 * Options passed to `calculatePeriodWindow` to respect per-standard preferences.
 */
export type CalculatePeriodWindowOptions = {
    periodStartPreference?: PeriodStartPreference;
};
/**
 * Calculates the period window for a given timestamp, cadence, timezone, and optional period start preference.
 *
 * @param timestampMs - The timestamp in milliseconds
 * @param cadence - The cadence object with interval and unit
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York')
 * @param options - Optional settings including period start preference
 * @returns Period window with start (inclusive), end (exclusive), period key, and label
 */
export declare function calculatePeriodWindow(timestampMs: TimestampMs, cadence: StandardCadence, timezone: string, options?: CalculatePeriodWindowOptions): PeriodWindow;
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
