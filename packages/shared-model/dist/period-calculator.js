"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePeriodWindow = calculatePeriodWindow;
exports.derivePeriodStatus = derivePeriodStatus;
const luxon_1 = require("luxon");
const LABEL_LOCALE = 'en-US';
function formatLabel(dt, format) {
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
function calculatePeriodWindow(timestampMs, cadence, timezone) {
    const zoned = luxon_1.DateTime.fromMillis(timestampMs, { zone: timezone });
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
function derivePeriodStatus(periodTotal, minimum, nowMs, periodEndMs) {
    if (periodTotal >= minimum) {
        return 'Met';
    }
    if (nowMs >= periodEndMs) {
        return 'Missed';
    }
    return 'In Progress';
}
//# sourceMappingURL=period-calculator.js.map