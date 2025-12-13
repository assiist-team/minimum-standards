"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatStandardSummary = formatStandardSummary;
/**
 * Formats a Standard's summary string in a normalized format.
 *
 * Examples:
 * - formatStandardSummary(1000, 'calls', { interval: 1, unit: 'week' }) => "1000 calls / week"
 * - formatStandardSummary(50, 'minutes', { interval: 2, unit: 'day' }) => "50 minutes / 2 days"
 * - formatStandardSummary(10, 'meetings', { interval: 1, unit: 'month' }) => "10 meetings / month"
 *
 * @param minimum - The minimum value for the standard
 * @param unit - The unit string (should be in plural form)
 * @param cadence - The cadence object with interval and unit
 * @returns A normalized summary string like "1000 calls / week"
 */
function formatStandardSummary(minimum, unit, cadence) {
    const { interval, unit: cadenceUnit } = cadence;
    // Format the cadence part
    let cadenceStr;
    if (interval === 1) {
        cadenceStr = cadenceUnit;
    }
    else {
        cadenceStr = `${interval} ${cadenceUnit}s`;
    }
    // Format the full summary: "minimum unit / cadence"
    return `${minimum} ${unit} / ${cadenceStr}`;
}
//# sourceMappingURL=standard-summary.js.map