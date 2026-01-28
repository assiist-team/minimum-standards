# Theme Selection

How to implement light/dark mode theme selection in your React Native app.

## Overview

The UI kit provides `lightTheme` and `darkTheme` objects, but theme selection logic is app-specific. This guide shows how to implement theme selection that matches the Minimum Standards mobile app pattern.

## Basic Implementation

### 1. Theme Preference Store

Create a store to manage user theme preference (using Zustand as an example):

```typescript
import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark' | 'system';

interface UIPreferencesState {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
}

export const useUIPreferencesStore = create<UIPreferencesState>((set) => ({
  themePreference: 'system',
  setThemePreference: (preference) => set({ themePreference: preference }),
}));
```

### 2. Theme Hook

Create a hook that combines system preference with user preference:

```typescript
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, type ColorTheme } from '@nine4/ui-kit';
import { useUIPreferencesStore } from './stores/uiPreferencesStore';

export function useTheme(): ColorTheme {
  const systemColorScheme = useColorScheme();
  const themePreference = useUIPreferencesStore((state) => state.themePreference);

  const isDark = themePreference === 'system' 
    ? systemColorScheme === 'dark' 
    : themePreference === 'dark';

  return isDark ? darkTheme : lightTheme;
}
```

### 3. Use the Hook

```typescript
import { useTheme } from './theme/useTheme';

function MyComponent() {
  const theme = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.background.screen }}>
      <Text style={{ color: theme.text.primary }}>
        Themed content
      </Text>
    </View>
  );
}
```

## Theme Preference Options

Users can choose from three options:

1. **Light** - Always use light theme
2. **Dark** - Always use dark theme  
3. **System** - Follow device system preference (default)

## Settings UI Example

```typescript
import { useUIPreferencesStore, ThemePreference } from './stores/uiPreferencesStore';

const themeOptions: { label: string; value: ThemePreference; icon: string }[] = [
  { label: 'Light', value: 'light', icon: 'light-mode' },
  { label: 'Dark', value: 'dark', icon: 'dark-mode' },
  { label: 'Auto', value: 'system', icon: 'brightness-auto' },
];

function ThemeSettings() {
  const { themePreference, setThemePreference } = useUIPreferencesStore();
  
  return (
    <View>
      {themeOptions.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => setThemePreference(option.value)}
        >
          <Text>{option.label}</Text>
          {themePreference === option.value && <Text>✓</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

## React Native Navigation Integration

If using React Navigation, you may want to update navigation theme when theme changes:

```typescript
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useTheme } from './theme/useTheme';

function AppNavigator() {
  const theme = useTheme();
  const isDark = theme === darkTheme;
  
  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      {/* Navigation structure */}
    </NavigationContainer>
  );
}
```

## Persistence

Persist theme preference to AsyncStorage or your preferred storage:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_PREFERENCE_KEY = '@theme_preference';

// Load on app start
const loadThemePreference = async () => {
  const saved = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
  if (saved) {
    useUIPreferencesStore.setState({ themePreference: saved as ThemePreference });
  }
};

// Save on change
const saveThemePreference = async (preference: ThemePreference) => {
  await AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference);
};
```

## Best Practices

1. **Default to System** - Use 'system' as the default preference
2. **Respect System Changes** - When preference is 'system', react to system theme changes
3. **Persist Preference** - Save user's choice and restore on app launch
4. **Provide Settings UI** - Let users easily change their preference
5. **Test Both Themes** - Ensure all screens work correctly in both light and dark modes

## Implementation Notes

- The UI kit does not include theme selection logic - this is intentionally app-specific
- Your app may use different state management (Redux, Context API, etc.)
- The `useTheme()` hook pattern shown here matches the Minimum Standards mobile app
- You can adapt this pattern to your app's architecture
