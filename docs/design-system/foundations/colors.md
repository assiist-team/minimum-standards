# Colors

The color system provides a comprehensive palette organized by semantic purpose. All colors are theme-aware and support both light and dark modes.

## Color Theme Structure

The `ColorTheme` interface defines all color tokens used throughout the app:

```typescript
interface ColorTheme {
  // Status colors (Met, In Progress, Missed)
  status: {
    met: { background, text, bar, barComplete, barOverflow };
    inProgress: { background, text, bar };
    missed: { background, text, bar };
  };
  
  // Archive/destructive colors
  archive: { background, text, badgeBackground, badgeText };
  
  // Primary UI colors (grayscale - NO BLUE)
  primary: { main, light, dark };
  
  // Background colors
  background: {
    screen,    // Screen-level background
    chrome,    // App chrome (headers, toolbars, tab bar)
    surface,   // Default surface for contained areas
    // Backwards-compatible aliases:
    primary, secondary, tertiary, card, modal, overlay
  };
  
  // Text colors
  text: { primary, secondary, tertiary, disabled, inverse };
  
  // Border colors
  border: { primary, secondary, focus };
  
  // Tab bar colors
  tabBar: { background, activeTint, inactiveTint, border };
  
  // Button colors
  button: {
    primary: { background, text };
    secondary: { background, text };
    disabled: { background, text };
    destructive: { background, text };
    icon: { background, icon };
  };
  
  // Input colors
  input: { background, border, borderError, text, placeholder };
  
  // Utility colors
  shadow: string;
  divider: string;
  activityIndicator: string;
  link: string;
}
```

## Light Theme

### Status Colors
- **Met**: Background `#F5F3EF`, Text `#987e55`, Bar `#987e55`
- **In Progress**: Background `#FFF8E1`, Text `#B06E00`, Bar `#F4B400`
- **Missed**: Background `#FCE8E6`, Text `#C5221F`, Bar `#C5221F`

### Primary Colors
- **Main**: `#000` (black)
- **Light**: `#666` (medium gray)
- **Dark**: `#111` (near black)

### Background Colors
- **Screen**: `#f7f8fa` (light gray)
- **Chrome**: `#fff` (white)
- **Surface**: `#fff` (white)
- **Card**: `#fff` (white)

### Text Colors
- **Primary**: `#111` (near black)
- **Secondary**: `#666` (medium gray)
- **Tertiary**: `#999` (light gray)
- **Disabled**: `#ccc` (very light gray)

### Border Colors
- **Primary**: `#ddd` (light gray)
- **Secondary**: `#e0e0e0` (very light gray)
- **Focus**: `#000` (black)

## Dark Theme

### Status Colors
- **Met**: Background `#3D3224`, Text `#987e55`, Bar `#987e55`
- **In Progress**: Background `#3E2E1A`, Text `#FFC107`, Bar `#FFC107`
- **Missed**: Background `#3E1E1E`, Text `#EF5350`, Bar `#EF5350`

### Primary Colors
- **Main**: `#fff` (white)
- **Light**: `#B0B0B0` (light gray)
- **Dark**: `#000` (black)

### Background Colors
- **Screen**: `#1E1E1E` (dark gray)
- **Chrome**: `#1E1E1E` (matches screen for unified chrome)
- **Surface**: `#2E2E2E` (slightly lighter gray)
- **Card**: `#2E2E2E` (slightly lighter gray)

### Text Colors
- **Primary**: `#E0E0E0` (light gray)
- **Secondary**: `#B0B0B0` (medium gray)
- **Tertiary**: `#888` (darker gray)
- **Disabled**: `#666` (dark gray)

### Border Colors
- **Primary**: `#4A4A4C` (medium dark gray)
- **Secondary**: `#4A4A4C` (medium dark gray)
- **Focus**: `#fff` (white)

## Usage Guidelines

### Background Colors
- Use `background.screen` for the primary page container
- Use `background.chrome` for headers, toolbars, and the bottom tab bar
- Use `background.surface` or `background.card` for contained areas like cards
- In dark mode, `chrome` matches `screen` for a unified appearance

### Text Colors
- Use `text.primary` for main content
- Use `text.secondary` for supporting information
- Use `text.tertiary` for less important text
- Use `text.disabled` for disabled states
- Use `text.inverse` for text on dark backgrounds

### Border Colors
- Use `border.secondary` for card borders (standardized at 1px width)
- Use `border.primary` for stronger borders when needed
- Use `border.focus` for focus states on interactive elements

### Status Colors
Use the `getStatusColors()` helper function to get status colors:

```typescript
import { getStatusColors } from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';

const theme = useTheme();
const statusColors = getStatusColors(theme, 'Met');
// Returns: { background, text, bar }
```

## Implementation

Colors are exported from `@nine4/ui-kit`:

```typescript
import { lightTheme, darkTheme, type ColorTheme } from '@nine4/ui-kit';
```

See [Theme Selection](../adoption/theme-selection.md) for how to implement theme switching in your app.
