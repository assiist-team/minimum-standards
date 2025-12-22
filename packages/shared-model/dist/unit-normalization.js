"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeUnitToPlural = normalizeUnitToPlural;
exports.formatUnitWithCount = formatUnitWithCount;
const pluralize_1 = __importDefault(require("pluralize"));
/**
 * Normalizes a unit string to its plural form.
 *
 * - If the input is already plural, it returns it unchanged (no duplication)
 * - If the input is singular, it converts it to plural
 * - If the input is blank or invalid, it throws an error
 *
 * @param unit - The unit string to normalize (can be singular or plural)
 * @returns The normalized plural form of the unit
 * @throws Error if the unit is blank or empty after trimming
 */
function normalizeUnitToPlural(unit) {
    const trimmed = unit.trim().toLowerCase();
    if (trimmed.length === 0) {
        throw new Error('Unit cannot be blank');
    }
    if (trimmed.length > 40) {
        throw new Error('Unit cannot exceed 40 characters');
    }
    // Check if already plural
    const isPlural = pluralize_1.default.isPlural(trimmed);
    if (isPlural) {
        return trimmed;
    }
    // Convert to plural
    return (0, pluralize_1.default)(trimmed);
}
/**
 * Formats a unit with a count, ensuring proper singular/plural form.
 *
 * @param unit - The unit string (should be in plural form)
 * @param count - The count to format with
 * @returns The formatted unit string (e.g., "1 call" vs "20 calls")
 */
function formatUnitWithCount(unit, count) {
    return (0, pluralize_1.default)(unit, count);
}
//# sourceMappingURL=unit-normalization.js.map