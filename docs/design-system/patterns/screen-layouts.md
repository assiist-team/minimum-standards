# Screen Layouts

Common screen container and header patterns.

## Screen Container Pattern

Most screens follow a consistent container pattern with safe area handling:

```typescript
import { SCREEN_PADDING } from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ScreenContainer({ children }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{
      flex: 1,
      backgroundColor: theme.background.screen,
    }}>
      {children}
    </View>
  );
}
```

## Header Pattern

The Settings screen provides the canonical header pattern:

```typescript
import { SCREEN_PADDING } from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ScreenHeader({ title, rightAction }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SCREEN_PADDING,
      paddingBottom: 16,
      paddingTop: Math.max(insets.top, 12),
      backgroundColor: theme.background.chrome,
      borderBottomWidth: 1,
      borderBottomColor: theme.border.secondary,
    }}>
      <View style={{ width: 60 }} />
      <Text style={{
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        color: theme.text.primary,
      }}>
        {title}
      </Text>
      <View style={{ width: 60, alignItems: 'flex-end' }}>
        {rightAction}
      </View>
    </View>
  );
}
```

## Screen Content Pattern

Content areas use consistent padding:

```typescript
import { ScrollView } from 'react-native';
import { SCREEN_PADDING } from '@nine4/ui-kit';

function ScreenContent({ children }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: SCREEN_PADDING }}
    >
      {children}
    </ScrollView>
  );
}
```

## Section Pattern

Grouped sections use section titles and cards:

```typescript
import { getCardBorderStyle, getCardBaseStyle, CARD_PADDING } from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';

function Section({ title, children }) {
  const theme = useTheme();
  
  return (
    <View>
      <Text style={{
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 0.5,
        color: theme.text.secondary,
      }}>
        {title}
      </Text>
      <View style={[
        getCardBaseStyle({ radius: 12 }),
        getCardBorderStyle(theme),
        {
          backgroundColor: theme.background.surface,
          marginBottom: 24,
        }
      ]}>
        {children}
      </View>
    </View>
  );
}
```

## Complete Screen Example

```typescript
import { View, ScrollView, Text } from 'react-native';
import { SCREEN_PADDING } from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ExampleScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ flex: 1, backgroundColor: theme.background.screen }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SCREEN_PADDING,
        paddingBottom: 16,
        paddingTop: Math.max(insets.top, 12),
        backgroundColor: theme.background.chrome,
        borderBottomWidth: 1,
        borderBottomColor: theme.border.secondary,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: theme.text.primary,
          }}>
            Screen Title
          </Text>
        </View>
      </View>
      
      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SCREEN_PADDING }}
      >
        {/* Screen content */}
      </ScrollView>
    </View>
  );
}
```

## Style Helpers

The UI kit provides helpers for screen layouts:

```typescript
import {
  getScreenContainerStyle,
  getScreenHeaderStyle,
  getSectionTitleStyle
} from '@nine4/ui-kit';

const containerStyle = getScreenContainerStyle(theme);
const headerStyle = getScreenHeaderStyle(theme, insets);
const sectionTitleStyle = getSectionTitleStyle(theme);
```

## Usage Guidelines

- Always use `background.screen` for the main container
- Use `background.chrome` for headers and toolbars
- Respect safe area insets for proper spacing
- Use `SCREEN_PADDING` for consistent content padding
- Follow the header pattern for consistent navigation

## Implementation

Screen layout helpers are exported from `@nine4/ui-kit`:

```typescript
import {
  getScreenContainerStyle,
  getScreenHeaderStyle,
  getSectionTitleStyle,
  SCREEN_PADDING
} from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';
```
