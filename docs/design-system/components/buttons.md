# Buttons

Button styles and variants for consistent interactive elements.

## Button Variants

### Primary Button
Main action button with brand color background.

```typescript
import { typography, BUTTON_BORDER_RADIUS } from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';

const theme = useTheme();

<TouchableOpacity
  style={[
    styles.button,
    {
      backgroundColor: theme.button.primary.background,
      borderRadius: BUTTON_BORDER_RADIUS,
    }
  ]}
>
  <Text style={[
    { color: theme.button.primary.text },
    typography.button.primary
  ]}>
    Primary Action
  </Text>
</TouchableOpacity>
```

### Secondary Button
Secondary action with neutral background.

```typescript
<TouchableOpacity
  style={[
    styles.button,
    {
      backgroundColor: theme.button.secondary.background,
      borderRadius: BUTTON_BORDER_RADIUS,
    }
  ]}
>
  <Text style={[
    { color: theme.button.secondary.text },
    typography.button.secondary
  ]}>
    Secondary Action
  </Text>
</TouchableOpacity>
```

### Destructive Button
For destructive actions (delete, archive, etc.).

```typescript
<TouchableOpacity
  style={[
    styles.button,
    {
      backgroundColor: theme.button.destructive.background,
      borderRadius: BUTTON_BORDER_RADIUS,
    }
  ]}
>
  <Text style={[
    { color: theme.button.destructive.text },
    typography.button.primary
  ]}>
    Delete
  </Text>
</TouchableOpacity>
```

### Disabled Button
Disabled state for any button variant.

```typescript
<TouchableOpacity
  disabled={true}
  style={[
    styles.button,
    {
      backgroundColor: theme.button.disabled.background,
      borderRadius: BUTTON_BORDER_RADIUS,
      opacity: 0.6,
    }
  ]}
>
  <Text style={[
    { color: theme.button.disabled.text },
    typography.button.primary
  ]}>
    Disabled
  </Text>
</TouchableOpacity>
```

### Icon Button
Icon-only button with background.

```typescript
<TouchableOpacity
  style={[
    styles.iconButton,
    {
      backgroundColor: theme.button.icon.background,
      borderRadius: BUTTON_BORDER_RADIUS,
    }
  ]}
>
  <MaterialIcons
    name="add"
    size={24}
    color={theme.button.icon.icon}
  />
</TouchableOpacity>
```

## Button Sizes

### Small Button
```typescript
<Text style={typography.button.small}>
  Small Button
</Text>
```

### Pill Button
```typescript
<Text style={typography.button.pill}>
  Pill Button
</Text>
```

## Usage Guidelines

- Use primary buttons for the main action on a screen
- Use secondary buttons for alternative actions
- Use destructive buttons sparingly and with clear confirmation
- Always provide disabled states for buttons that can't be used
- Icon buttons should have sufficient touch target size (minimum 44x44 points)

## Implementation

Button colors and typography are exported from `@nine4/ui-kit`:

```typescript
import { typography, BUTTON_BORDER_RADIUS } from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';
```
