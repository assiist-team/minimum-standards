# Migration Guide

Guide for migrating from app-specific theme implementations to `@nine4/ui-kit`.

## Overview

If you're migrating an existing app that has its own theme implementation, this guide will help you transition to the shared UI kit.

## Migration Steps

### 1. Install the Package

```bash
npm install @nine4/ui-kit
```

### 2. Update Imports

Replace app-specific theme imports with UI kit imports:

**Before:**
```typescript
import { lightTheme, darkTheme } from './theme/colors';
import { typography } from './theme/typography';
import { SCREEN_PADDING } from './theme/spacing';
```

**After:**
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

### 3. Update Theme Hook

If your app has a `useTheme()` hook, update it to use UI kit themes:

**Before:**
```typescript
import { lightTheme, darkTheme } from './theme/colors';

export function useTheme() {
  // Your theme selection logic
  return isDark ? darkTheme : lightTheme;
}
```

**After:**
```typescript
import { lightTheme, darkTheme, type ColorTheme } from '@nine4/ui-kit';

export function useTheme(): ColorTheme {
  // Your theme selection logic (keep this app-specific)
  return isDark ? darkTheme : lightTheme;
}
```

### 4. Migrate Style Helpers

Replace app-specific style helpers with UI kit helpers:

**Before:**
```typescript
// apps/mobile/src/theme/card.ts
export function getCardBorderStyle(theme: ColorTheme) {
  return {
    borderWidth: 1,
    borderColor: theme.border.secondary,
  };
}
```

**After:**
```typescript
import { getCardBorderStyle } from '@nine4/ui-kit';
// Use the helper directly
```

### 5. Update Component Imports

Update components to use UI kit exports:

**Before:**
```typescript
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { SCREEN_PADDING } from '../theme/spacing';
```

**After:**
```typescript
import { typography, SCREEN_PADDING } from '@nine4/ui-kit';
import { useTheme } from '../theme/useTheme';
```

### 6. Update Card Styling

Replace manual card border styling with helpers:

**Before:**
```typescript
<View style={{
  borderWidth: 1,
  borderColor: theme.border.secondary,
  borderRadius: 12,
}}>
```

**After:**
```typescript
import { getCardBorderStyle, getCardBaseStyle } from '@nine4/ui-kit';

<View style={[
  getCardBaseStyle({ radius: 12 }),
  getCardBorderStyle(theme),
]}>
```

## Breaking Changes

### Theme Structure

The UI kit theme structure matches the existing mobile app structure, so if you're migrating from that app, there should be no breaking changes. If migrating from a different structure:

1. **Check color token names** - Ensure your app uses the same token names
2. **Update any custom colors** - Move app-specific colors to your app code
3. **Review typography** - Ensure font sizes match your design

### Removed Files

After migration, you can remove:
- `apps/mobile/src/theme/colors.ts` (moved to UI kit)
- `apps/mobile/src/theme/typography.ts` (moved to UI kit)
- `apps/mobile/src/theme/spacing.ts` (moved to UI kit)
- `apps/mobile/src/theme/radius.ts` (moved to UI kit)
- Any app-specific card style helpers (replaced by UI kit helpers)

**Keep:**
- `apps/mobile/src/theme/useTheme.ts` (app-specific theme selection logic)

## Verification Checklist

After migration, verify:

- [ ] All imports updated to use `@nine4/ui-kit`
- [ ] Theme selection still works (light/dark/system)
- [ ] All screens render correctly in both themes
- [ ] Card borders are consistent (1px, `border.secondary`)
- [ ] Typography matches design
- [ ] Spacing is consistent across screens
- [ ] No hardcoded colors remain (except error states if needed)
- [ ] Tab bar styling matches design
- [ ] Status colors work correctly

## Rollback Plan

If you need to rollback:

1. Keep a backup of your original theme files
2. Revert imports to use local theme files
3. Restore any app-specific theme customizations

## Getting Help

If you encounter issues during migration:

1. Check the [Getting Started](./getting-started.md) guide
2. Review the [Foundations](../foundations/) documentation
3. Compare your implementation with the mobile app's usage
4. Ensure you're using the latest version of `@nine4/ui-kit`

## Next Steps

After successful migration:

1. Remove old theme files
2. Update documentation to reference UI kit
3. Share the UI kit with other apps in your organization
4. Contribute improvements back to the UI kit
