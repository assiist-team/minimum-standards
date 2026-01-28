# Getting Started

This guide will help you integrate the Minimum Standards design system into your React Native app.

## Installation

Install the UI kit package:

```bash
npm install @nine4/ui-kit
```

Or with yarn:

```bash
yarn add @nine4/ui-kit
```

## Basic Setup

### 1. Import Theme Tokens

```typescript
import {
  lightTheme,
  darkTheme,
  typography,
  SCREEN_PADDING,
  CARD_PADDING,
  CARD_LIST_GAP,
  BUTTON_BORDER_RADIUS,
} from '@nine4/ui-kit';
```

### 2. Set Up Theme Selection

See [Theme Selection](./theme-selection.md) for detailed instructions on implementing light/dark mode support.

Basic example:

```typescript
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, type ColorTheme } from '@nine4/ui-kit';

function useTheme(): ColorTheme {
  const systemColorScheme = useColorScheme();
  // Add your app's theme preference logic here
  const isDark = systemColorScheme === 'dark';
  return isDark ? darkTheme : lightTheme;
}
```

### 3. Use Design Tokens

```typescript
import { typography, SCREEN_PADDING } from '@nine4/ui-kit';
import { useTheme } from './theme/useTheme';

function MyComponent() {
  const theme = useTheme();
  
  return (
    <View style={{
      backgroundColor: theme.background.screen,
      padding: SCREEN_PADDING,
    }}>
      <Text style={[
        { color: theme.text.primary },
        typography.text.body
      ]}>
        Hello, World!
      </Text>
    </View>
  );
}
```

## Using Style Helpers

### Card Styling

```typescript
import { getCardBorderStyle, getCardBaseStyle } from '@nine4/ui-kit';
import { useTheme } from './theme/useTheme';

function MyCard() {
  const theme = useTheme();
  
  return (
    <View style={[
      getCardBaseStyle({ radius: 12 }),
      getCardBorderStyle(theme),
      { backgroundColor: theme.background.surface }
    ]}>
      {/* Card content */}
    </View>
  );
}
```

### Screen Layouts

```typescript
import { getScreenContainerStyle, getScreenHeaderStyle } from '@nine4/ui-kit';
import { useTheme } from './theme/useTheme';

function MyScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={getScreenContainerStyle(theme)}>
      <View style={getScreenHeaderStyle(theme, insets)}>
        {/* Header content */}
      </View>
      {/* Screen content */}
    </View>
  );
}
```

### Tab Bar Styling

```typescript
import { getTabBarStyle, getTabBarConstants } from '@nine4/ui-kit';
import { useTheme } from './theme/useTheme';

function MyTabNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarStyle = getTabBarStyle(theme, insets);
  
  // Use tabBarStyle in your Tab.Navigator configuration
}
```

## Next Steps

- Read the [Theme Selection](./theme-selection.md) guide for implementing theme switching
- Review [Components](../components/) documentation for reusable UI patterns
- Check [Patterns](../patterns/) for navigation and layout patterns
- See [Migration Guide](./migration-guide.md) if migrating from app-specific themes

## Package Structure

The `@nine4/ui-kit` package exports:

- **Themes**: `lightTheme`, `darkTheme`, `ColorTheme` type
- **Typography**: `typography`, `TypographyTheme` type
- **Spacing**: `SCREEN_PADDING`, `CARD_PADDING`, `CARD_LIST_GAP`
- **Radius**: `BUTTON_BORDER_RADIUS`
- **Helpers**: `getStatusColors()`, `getCardBorderStyle()`, `getCardBaseStyle()`, etc.
- **Hooks**: None (your app should provide a `useTheme()` hook)

## TypeScript Support

The package includes full TypeScript definitions. Import types as needed:

```typescript
import type {
  ColorTheme,
  TypographyTheme,
} from '@nine4/ui-kit';
```
