import { create } from 'zustand';
import { Activity, StandardCadence, formatStandardSummary, StandardSessionConfig } from '@minimum-standards/shared-model';

export interface StandardsBuilderState {
  // Activity selection
  selectedActivity: Activity | null;
  setSelectedActivity: (activity: Activity | null) => void;

  // Cadence configuration
  cadence: StandardCadence | null;
  setCadence: (cadence: StandardCadence | null) => void;

  // Goal: Total per period (what user enters)
  goalTotal: number | null;
  setGoalTotal: (goalTotal: number | null) => void;
  unitOverride: string | null; // Override for unit (null means use Activity's unit)
  setUnitOverride: (unit: string | null) => void;

  // Breakdown configuration (session-based mode)
  breakdownEnabled: boolean;
  setBreakdownEnabled: (enabled: boolean) => void;
  sessionLabel: string;
  setSessionLabel: (label: string) => void;
  sessionsPerCadence: number | null;
  setSessionsPerCadence: (sessions: number | null) => void;
  volumePerSession: number | null;
  setVolumePerSession: (volume: number | null) => void;

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
    sessionConfig: StandardSessionConfig;
  } | null;
}

const defaultWeeklyCadence: StandardCadence = {
  interval: 1,
  unit: 'week',
};

const initialState = {
  selectedActivity: null,
  cadence: defaultWeeklyCadence,
  goalTotal: null,
  unitOverride: null,
  breakdownEnabled: false,
  sessionLabel: 'session',
  sessionsPerCadence: null,
  volumePerSession: null,
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

  setGoalTotal: (goalTotal) => {
    set({ goalTotal });
  },

  setUnitOverride: (unitOverride) => {
    set({ unitOverride });
  },

  setBreakdownEnabled: (enabled) => {
    set({ breakdownEnabled: enabled });
  },

  setSessionLabel: (label) => {
    set({ sessionLabel: label.trim() || 'session' });
  },

  setSessionsPerCadence: (sessions) => {
    set({ sessionsPerCadence: sessions });
  },

  setVolumePerSession: (volume) => {
    set({ volumePerSession: volume });
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
    
    if (!effectiveUnit || !state.cadence) {
      return null;
    }

    // Calculate session config based on current state
    let sessionConfig: StandardSessionConfig | undefined;
    let minimum: number;

    if (state.breakdownEnabled && state.sessionsPerCadence !== null && state.volumePerSession !== null) {
      // Session-based mode: calculate minimum from session config
      minimum = state.sessionsPerCadence * state.volumePerSession;
      sessionConfig = {
        sessionLabel: state.sessionLabel || 'session',
        sessionsPerCadence: state.sessionsPerCadence,
        volumePerSession: state.volumePerSession,
      };
    } else if (state.goalTotal !== null) {
      // Direct minimum mode: use goalTotal as minimum, store as 1 session
      minimum = state.goalTotal;
      sessionConfig = {
        sessionLabel: state.sessionLabel || 'session',
        sessionsPerCadence: 1,
        volumePerSession: state.goalTotal,
      };
    } else {
      return null;
    }

    return formatStandardSummary(minimum, effectiveUnit, state.cadence, sessionConfig);
  },

  generatePayload: () => {
    const state = get();
    const effectiveUnit = state.getEffectiveUnit();

    if (
      !state.selectedActivity ||
      !effectiveUnit ||
      !state.cadence
    ) {
      return null;
    }

    // Determine session config and calculate minimum
    let sessionConfig: StandardSessionConfig;
    let minimum: number;

    if (state.breakdownEnabled) {
      // Session-based mode: validate session config inputs
      if (
        state.sessionsPerCadence === null ||
        state.volumePerSession === null ||
        state.sessionsPerCadence <= 0 ||
        state.volumePerSession <= 0
      ) {
        return null;
      }
      minimum = state.sessionsPerCadence * state.volumePerSession;
      sessionConfig = {
        sessionLabel: state.sessionLabel || 'session',
        sessionsPerCadence: state.sessionsPerCadence,
        volumePerSession: state.volumePerSession,
      };
    } else {
      // Direct minimum mode: use goalTotal, store as 1 session
      if (state.goalTotal === null || state.goalTotal <= 0) {
        return null;
      }
      minimum = state.goalTotal;
      sessionConfig = {
        sessionLabel: state.sessionLabel || 'session',
        sessionsPerCadence: 1,
        volumePerSession: state.goalTotal,
      };
    }

    const summary = formatStandardSummary(
      minimum,
      effectiveUnit,
      state.cadence,
      sessionConfig
    );

    return {
      activityId: state.selectedActivity.id,
      minimum,
      unit: effectiveUnit,
      cadence: state.cadence,
      summary,
      sessionConfig,
    };
  },

  reset: () => {
    set(initialState);
  },
}));
