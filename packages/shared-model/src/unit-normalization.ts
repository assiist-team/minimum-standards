import pluralize from 'pluralize';

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
export function normalizeUnitToPlural(unit: string): string {
  const trimmed = unit.trim();
  
  if (trimmed.length === 0) {
    throw new Error('Unit cannot be blank');
  }
  
  if (trimmed.length > 40) {
    throw new Error('Unit cannot exceed 40 characters');
  }
  
  // Check if already plural
  const isPlural = pluralize.isPlural(trimmed);
  
  if (isPlural) {
    return trimmed;
  }
  
  // Convert to plural
  return pluralize(trimmed);
}

/**
 * Formats a unit with a count, ensuring proper singular/plural form.
 * 
 * @param unit - The unit string (should be in plural form)
 * @param count - The count to format with
 * @returns The formatted unit string (e.g., "1 call" vs "20 calls")
 */
export function formatUnitWithCount(unit: string, count: number): string {
  return pluralize(unit, count);
}
