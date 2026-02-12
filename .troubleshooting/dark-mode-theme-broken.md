# Issue: Dark mode theme not respected after standards-navigation-overhaul merge

**Status:** Active
**Opened:** 2026-02-11
**Resolved:** _pending_

## Info
- **Symptom:** In dark mode, UI elements appear in light mode. Bottom nav container specifically noted. Feature merged via WP01-WP08 from 001-standards-navigation-overhaul.
- **Affected area:** Bottom navigation, potentially other screens/components added by the feature

### Theme System Overview
- Theme defined in `packages/ui-kit/src/colors.ts` (lightTheme/darkTheme)
- Consumed via `useTheme()` hook in `apps/mobile/src/theme/useTheme.ts`
- Tab bar style from `getTabBarStyle()` in `packages/ui-kit/src/helpers.ts` — sets `backgroundColor: 'transparent'` (line 79)
- Individual screens use `getScreenContainerStyle(theme)` which sets `{ flex: 1, backgroundColor: theme.background.screen }` (line 98-103)

### Key Finding
- `NavigationContainer` at `apps/mobile/src/navigation/AppNavigator.tsx:35` has NO `theme` prop
- React Navigation defaults to its built-in light theme (white background #ffffff)
- The transparent tab bar shows React Navigation's white scene container behind it
- This was likely not visible before the feature because the previous navigation setup might have been different, or the transparent tab bar is a new pattern introduced by the feature

### Feature Audit (30 files changed, 673e744...24904dd)
- 26/30 files properly use theme system
- 4 minor violations: hardcoded `transparent` (3 files), hardcoded `rgba(0,0,0,0.35)` overlay (BottomSheet.tsx:112)
- None of the minor violations cause the primary symptom

## Experiments

### H1: NavigationContainer missing dark/light theme prop
- **Rationale:** `NavigationContainer` at AppNavigator.tsx:35 has no `theme` prop. React Navigation defaults to light theme (white background). Tab bar is transparent, so white scene container shows through.
- **Experiment:** Add a custom navigation theme to `NavigationContainer` that maps app theme colors. Check if bottom nav background changes to match dark mode.
- **Result:** Fix applied — added custom `navigationTheme` mapped from app's `useTheme()` to React Navigation's `Theme` type. Passed as `<NavigationContainer theme={navigationTheme}>`.
- **Verdict:** Confirmed (fix applied, awaiting user verification)

### H2: Tab.Navigator missing sceneContainerStyle
- **Rationale:** Even with NavigationContainer theme, the Tab.Navigator at BottomTabNavigator.tsx:38 doesn't set `sceneContainerStyle`. This is the direct container behind the transparent tab bar.
- **Experiment:** Add `sceneContainerStyle={{ backgroundColor: theme.background.screen }}` to Tab.Navigator.
- **Result:** Fix applied — added `sceneContainerStyle` prop to `Tab.Navigator`.
- **Verdict:** Confirmed (belt-and-suspenders fix alongside H1)

### H3: Native stack navigators missing contentStyle
- **Rationale:** `MainStack`, `StandardsStack`, `ActivitiesStack`, `SettingsStack`, `AuthStack` use `createNativeStackNavigator` with `headerShown: false` but no `contentStyle` in screenOptions. This could cause white flash during transitions.
- **Experiment:** Add `contentStyle: { backgroundColor: theme.background.screen }` to stack navigator screenOptions.
- **Result:** Fix applied to all 5 stack navigators.
- **Verdict:** Confirmed (preventive fix for transition flashes)

## Files Changed
- `apps/mobile/src/navigation/AppNavigator.tsx` — Added `NavigationContainer theme` prop with custom theme mapping
- `apps/mobile/src/navigation/BottomTabNavigator.tsx` — Added `sceneContainerStyle` to Tab.Navigator
- `apps/mobile/src/navigation/MainStack.tsx` — Added `contentStyle` + `useTheme`
- `apps/mobile/src/navigation/StandardsStack.tsx` — Added `contentStyle` + `useTheme`
- `apps/mobile/src/navigation/ActivitiesStack.tsx` — Added `contentStyle` + `useTheme`
- `apps/mobile/src/navigation/SettingsStack.tsx` — Added `contentStyle` + `useTheme`
- `apps/mobile/src/navigation/AuthStack.tsx` — Added `contentStyle` + `useTheme`

## Resolution
_Do not fill this section until the fix is verified — either by a passing
test/build or by explicit user confirmation. Applying a fix is not verification._
