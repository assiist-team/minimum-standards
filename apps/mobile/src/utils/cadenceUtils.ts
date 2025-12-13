import { StandardCadence, CadenceUnit } from '@minimum-standards/shared-model';

/**
 * Cadence presets for quick selection
 */
export const CADENCE_PRESETS = {
  daily: { interval: 1, unit: 'day' as CadenceUnit },
  weekly: { interval: 1, unit: 'week' as CadenceUnit },
  monthly: { interval: 1, unit: 'month' as CadenceUnit },
} as const;

export type CadencePreset = keyof typeof CADENCE_PRESETS;

/**
 * Gets a cadence preset by key
 */
export function getCadencePreset(preset: CadencePreset): StandardCadence {
  return CADENCE_PRESETS[preset];
}

/**
 * Validates a custom cadence interval and unit
 * @param interval - The interval number (must be positive integer)
 * @param unit - The cadence unit
 * @returns Validation result with isValid flag and optional error message
 */
export function validateCadence(
  interval: number | null,
  unit: CadenceUnit | null
): { isValid: boolean; error?: string } {
  if (interval === null || unit === null) {
    return { isValid: false, error: 'Interval and unit are required' };
  }

  if (!Number.isInteger(interval) || interval < 1) {
    return { isValid: false, error: 'Interval must be a positive integer' };
  }

  const validUnits: CadenceUnit[] = ['day', 'week', 'month'];
  if (!validUnits.includes(unit)) {
    return { isValid: false, error: 'Unit must be day, week, or month' };
  }

  return { isValid: true };
}

/**
 * Creates a custom cadence from interval and unit
 * @param interval - The interval number
 * @param unit - The cadence unit
 * @returns StandardCadence object or null if invalid
 */
export function createCustomCadence(
  interval: number | null,
  unit: CadenceUnit | null
): StandardCadence | null {
  const validation = validateCadence(interval, unit);
  if (!validation.isValid) {
    return null;
  }

  return {
    interval: interval!,
    unit: unit!,
  };
}

/**
 * Checks if a cadence matches a preset
 */
export function isPresetCadence(
  cadence: StandardCadence | null,
  preset: CadencePreset
): boolean {
  if (!cadence) {
    return false;
  }

  const presetCadence = CADENCE_PRESETS[preset];
  return (
    cadence.interval === presetCadence.interval &&
    cadence.unit === presetCadence.unit
  );
}
