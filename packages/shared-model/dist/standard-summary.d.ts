import { StandardCadence, StandardSessionConfig } from './types';
/**
 * Formats a Standard's summary string in a normalized format.
 *
 * Examples:
 * - formatStandardSummary(1000, 'calls', { interval: 1, unit: 'week' }) => "1000 calls / week"
 * - formatStandardSummary(50, 'minutes', { interval: 2, unit: 'day' }) => "50 minutes / 2 days"
 * - formatStandardSummary(75, 'minutes', { interval: 1, unit: 'week' }, { sessionLabel: 'session', sessionsPerCadence: 5, volumePerSession: 15 }) => "5 sessions × 15 minutes = 75 minutes / week"
 * - formatStandardSummary(1000, 'calls', { interval: 1, unit: 'week' }, { sessionLabel: 'session', sessionsPerCadence: 1, volumePerSession: 1000 }) => "1000 calls / week"
 *
 * @param minimum - The minimum value for the standard
 * @param unit - The unit string (should be in plural form, will be normalized to lowercase)
 * @param cadence - The cadence object with interval and unit
 * @param sessionConfig - Optional session configuration. If provided and sessionsPerCadence > 1, shows session breakdown
 * @returns A normalized summary string like "1000 calls / week" or "5 sessions × 15 minutes = 75 minutes / week"
 */
export declare function formatStandardSummary(minimum: number, unit: string, cadence: StandardCadence, sessionConfig?: StandardSessionConfig): string;
