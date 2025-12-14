import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, type ColorTheme } from './colors';

/**
 * Hook to get the current theme based on the system color scheme
 */
export function useTheme(): ColorTheme {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}
