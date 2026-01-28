import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, type ColorTheme } from '@nine4/ui-kit';
import { useUIPreferencesStore } from '../stores/uiPreferencesStore';

/**
 * Hook to get the current theme based on the user preference or system color scheme
 */
export function useTheme(): ColorTheme {
  const systemColorScheme = useColorScheme();
  const themePreference = useUIPreferencesStore((state) => state.themePreference);

  const isDark = themePreference === 'system' 
    ? systemColorScheme === 'dark' 
    : themePreference === 'dark';

  return isDark ? darkTheme : lightTheme;
}
