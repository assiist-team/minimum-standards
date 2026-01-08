import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChartType = 'Daily Volume' | 'Daily Progress' | 'Period Progress' | 'Standards Progress';

interface UIPreferencesState {
  preferredActivityChart: ChartType;
  setPreferredActivityChart: (chart: ChartType) => void;
}

// Since I didn't see @react-native-async-storage/async-storage in package.json earlier,
// I should verify it or use a fallback. 
// Actually, I'll check if any other store uses persistence.

export const useUIPreferencesStore = create<UIPreferencesState>()(
  persist(
    (set) => ({
      preferredActivityChart: 'Daily Volume',
      setPreferredActivityChart: (chart) => set({ preferredActivityChart: chart }),
    }),
    {
      name: 'ui-preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
