"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatStandardSummary = formatStandardSummary;
const unit_normalization_1 = require("./unit-normalization");
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
function formatStandardSummary(minimum, unit, cadence, sessionConfig) {
    // Normalize unit to lowercase plural form for consistent display
    const normalizedUnit = (0, unit_normalization_1.normalizeUnitToPlural)(unit);
    const { interval, unit: cadenceUnit } = cadence;
    // Format the cadence part
    let cadenceStr;
    if (interval === 1) {
        cadenceStr = cadenceUnit;
    }
    else {
        cadenceStr = `${interval} ${cadenceUnit}s`;
    }
    // If session config is provided and sessionsPerCadence > 1, show session breakdown
    if (sessionConfig && sessionConfig.sessionsPerCadence > 1) {
        const sessionLabelPlural = sessionConfig.sessionsPerCadence === 1
            ? sessionConfig.sessionLabel
            : `${sessionConfig.sessionLabel}s`;
        const sessionVolumeText = (0, unit_normalization_1.formatUnitWithCount)(normalizedUnit, sessionConfig.volumePerSession);
        const minimumText = (0, unit_normalization_1.formatUnitWithCount)(normalizedUnit, minimum);
        return `${sessionConfig.sessionsPerCadence} ${sessionLabelPlural} × ${sessionVolumeText} = ${minimumText} / ${cadenceStr}`;
    }
    // Direct minimum mode (sessionsPerCadence === 1 or no sessionConfig): "minimum unit / cadence"
    return `${(0, unit_normalization_1.formatUnitWithCount)(normalizedUnit, minimum)} / ${cadenceStr}`;
}
//# sourceMappingURL=standard-summary.js.map