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
export declare function normalizeUnitToPlural(unit: string): string;
/**
 * Formats a unit with a count, ensuring proper singular/plural form.
 *
 * @param unit - The unit string (should be in plural form)
 * @param count - The count to format with
 * @returns The formatted unit string (e.g., "1 call" vs "20 calls")
 */
export declare function formatUnitWithCount(unit: string, count: number): string;
