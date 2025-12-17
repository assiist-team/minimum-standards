import { create } from 'zustand';
import { Activity, StandardCadence, formatStandardSummary } from '@minimum-standards/shared-model';

export interface StandardsBuilderState {
  // Activity selection
  selectedActivity: Activity | null;
  setSelectedActivity: (activity: Activity | null) => void;

  // Cadence configuration
  cadence: StandardCadence | null;
  setCadence: (cadence: StandardCadence | null) => void;

  // Minimum and unit
  minimum: number | null;
  setMinimum: (minimum: number | null) => void;
  unitOverride: string | null; // Override for unit (null means use Activity's unit)
  setUnitOverride: (unit: string | null) => void;

  // Reset store
  reset: () => void;

  // Get the effective unit (Activity's unit or override)
  getEffectiveUnit: () => string | null;

  // Get summary preview (computed)
  getSummaryPreview: () => string | null;

  // Generate payload for Firestore
  generatePayload: () => {
    activityId: string;
    minimum: number;
    unit: string;
    cadence: StandardCadence;
    summary: string;
  } | null;
}

const defaultWeeklyCadence: StandardCadence = {
  interval: 1,
  unit: 'week',
};

const initialState = {
  selectedActivity: null,
  cadence: defaultWeeklyCadence,
  minimum: null,
  unitOverride: null,
};

export const useStandardsBuilderStore = create<StandardsBuilderState>((set, get) => ({
  ...initialState,

  setSelectedActivity: (activity) => {
    set({ selectedActivity: activity });
    // Reset unit override when activity changes (will use Activity's unit)
    if (activity) {
      set({ unitOverride: null });
    }
  },

  setCadence: (cadence) => {
    set({ cadence });
  },

  setMinimum: (minimum) => {
    set({ minimum });
  },

  setUnitOverride: (unitOverride) => {
    set({ unitOverride });
  },

  getEffectiveUnit: () => {
    const state = get();
    if (state.unitOverride) {
      return state.unitOverride;
    }
    return state.selectedActivity?.unit ?? null;
  },

  getSummaryPreview: () => {
    const state = get();
    const effectiveUnit = state.getEffectiveUnit();
    
    if (
      state.minimum !== null &&
      effectiveUnit &&
      state.cadence
    ) {
      return formatStandardSummary(
        state.minimum,
        effectiveUnit,
        state.cadence
      );
    }
    return null;
  },

  generatePayload: () => {
    const state = get();
    const effectiveUnit = state.getEffectiveUnit();

    if (
      !state.selectedActivity ||
      state.minimum === null ||
      !effectiveUnit ||
      !state.cadence
    ) {
      return null;
    }

    const summary = formatStandardSummary(
      state.minimum,
      effectiveUnit,
      state.cadence
    );

    return {
      activityId: state.selectedActivity.id,
      minimum: state.minimum,
      unit: effectiveUnit,
      cadence: state.cadence,
      summary,
    };
  },

  reset: () => {
    set(initialState);
  },
}));
