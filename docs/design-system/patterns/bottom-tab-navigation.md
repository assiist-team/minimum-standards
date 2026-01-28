# Bottom Tab Navigation

Bottom tab navigation styling and behavior patterns.

## Tab Bar Styling

The bottom tab bar uses a transparent background with a custom shell container for proper theming and safe area handling.

## Tab Bar Constants

```typescript
interface TabBarConstants {
  baseTabBarHeight: {
    ios: 88;
    android: 64;
  };
  baseBottomPadding: {
    ios: 20;
    android: 12;
  };
}
```

## Tab Bar Colors

```typescript
interface TabBarColors {
  background: string;      // Tab bar background
  activeTint: string;      // Active tab icon/text color
  inactiveTint: string;   // Inactive tab icon/text color
  border: string;         // Top border color
}
```

## Implementation Pattern

### Tab Bar Shell Container

The tab bar uses a shell container to handle theming and safe areas:

```typescript
import { useTheme } from '../theme/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

function TabBarShell({ children }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <View
      style={{
        backgroundColor: Platform.OS === 'android' 
          ? theme.background.screen 
          : theme.tabBar.background,
        borderTopColor: theme.tabBar.border,
        borderTopWidth: 1,
        marginBottom: Platform.OS === 'android' ? insets.bottom : 0,
      }}
    >
      {children}
    </View>
  );
}
```

### Tab Navigator Configuration

```typescript
import { useTheme } from '../theme/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

function BottomTabNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const baseTabBarHeight = Platform.OS === 'ios' ? 88 : 64;
  const baseBottomPadding = Platform.OS === 'ios' ? 20 : 12;
  const bottomPadding = Platform.OS === 'ios' 
    ? Math.max(insets.bottom, baseBottomPadding) 
    : baseBottomPadding;
  const androidMinHeight = baseTabBarHeight + bottomPadding;

  return (
    <Tab.Navigator
      tabBar={(props) => <TabBarShell><BottomTabBar {...props} /></TabBarShell>}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabBar.activeTint,
        tabBarInactiveTintColor: theme.tabBar.inactiveTint,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: 'transparent',
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 },
          paddingTop: 8,
          paddingLeft: Math.max(insets.left, 16),
          paddingRight: Math.max(insets.right, 16),
          paddingBottom: bottomPadding,
          height: Platform.OS === 'ios' ? baseTabBarHeight : undefined,
          minHeight: Platform.OS === 'ios' ? undefined : androidMinHeight,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      {/* Tab screens */}
    </Tab.Navigator>
  );
}
```

## Style Helpers

The UI kit provides helpers for tab bar styling:

```typescript
import { getTabBarStyle, getTabBarConstants } from '@nine4/ui-kit';

const constants = getTabBarConstants();
const tabBarStyle = getTabBarStyle(theme, insets);
```

## Platform Differences

### iOS
- Tab bar height: 88px
- Bottom padding: max(safe area bottom, 20px)
- Background matches tab bar theme color

### Android
- Tab bar min height: 64px + bottom padding
- Bottom padding: 12px (or safe area if larger)
- Background matches screen background for consistency

## Usage Guidelines

- Always respect safe area insets for proper spacing
- Use transparent tab bar background with shell container for theming
- Maintain consistent active/inactive tint colors
- Ensure sufficient touch target sizes for tab items
- Handle platform-specific height requirements

## Implementation

Tab bar style helpers are exported from `@nine4/ui-kit`:

```typescript
import { getTabBarStyle, getTabBarConstants } from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';
```
