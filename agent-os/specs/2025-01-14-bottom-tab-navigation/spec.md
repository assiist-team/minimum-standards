# Specification: Bottom Tab Navigation

## Goal
Implement a modern bottom tab navigation structure that replaces the current HomeScreen menu with always-visible tabs, providing faster access to main sections and following mobile UX best practices. Each tab contains a stack navigator for hierarchical navigation flows.

## User Stories
- As a user, I want to quickly switch between Dashboard, Standards, Activities, and Settings with one tap so that I can access core features without navigating through a menu screen.
- As a user, I want to see which section I'm currently in at all times so that I understand my location in the app.
- As a user, I want to navigate to detail screens (like Standard Detail) and return to the same tab I came from so that my navigation context is preserved.
- As a developer, I want a clear navigation hierarchy (tabs for sections, stacks for details) so that the app structure is maintainable and scalable.

## Specific Requirements

**Bottom tab navigator setup**
- Install `@react-navigation/bottom-tabs` package (already listed in tech stack but not yet installed)
- Create `BottomTabNavigator` component using `createBottomTabNavigator` from React Navigation
- Configure four tabs: Dashboard, Standards, Activities, Settings
- Set `ActiveStandardsDashboard` as the initial tab (Dashboard tab)
- Ensure tabs are always visible and accessible via thumb-friendly positioning at bottom of screen
- Use appropriate icons for each tab (install `react-native-vector-icons` or use React Native's built-in icon support)
- Display tab labels alongside icons for clarity

**Tab structure and stack navigation**
- Each tab contains its own stack navigator for drill-down flows:
  - **Dashboard tab:** Active Standards Dashboard → Standard Detail
  - **Standards tab:** Standards Library → Standards Builder → Standard Detail (with Active/Archived filtering in Library)
  - **Activities tab:** Activity Library (standalone)
  - **Settings tab:** Settings (standalone)
- Maintain existing screen components and wrappers; only restructure navigation hierarchy
- Ensure back navigation within each tab stack works correctly
- Preserve navigation state when switching between tabs
- Standards Builder should be accessible from Standards Library (via button/navigation) and can be a screen in the Standards tab stack

**Navigation type definitions**
- Update `MainStackParamList` to reflect new structure with tab navigator
- Create `BottomTabParamList` type with four tab routes
- Ensure TypeScript types are properly nested: `RootStackParamList` → `MainTabNavigator` → individual tab stacks
- Update global navigation type declarations for type-safe navigation

**HomeScreen removal**
- Remove `HomeScreen` component from navigation (deprecate or delete file)
- Remove `Home` route from navigation types and stacks
- Ensure all navigation flows that previously went through HomeScreen now use direct tab navigation
- Update any deep links or navigation references to use tab routes instead

**Tab icons and labels**
- Install icon library (`react-native-vector-icons` recommended for React Native CLI)
- Select appropriate icons for each tab:
  - Dashboard: home/chart/grid icon
  - Standards: list/book/checklist icon
  - Activities: activity/target/star icon
  - Settings: gear/settings icon
- Use consistent icon sizing (24-28px recommended)
- Ensure icons are accessible with proper contrast and touch targets (minimum 44px)
- Support both active and inactive icon states with appropriate color changes

**Styling and theming**
- Match tab bar styling to app's existing design system
- Support light/dark theme modes using existing theme tokens
- Ensure tab bar respects safe area insets (especially on iOS devices with home indicator)
- Use consistent spacing and typography from existing screens
- Apply appropriate active/inactive tab colors based on theme

**Navigation behavior**
- Tapping an active tab should reset that tab's stack to its root screen (standard React Navigation behavior)
- Ensure smooth transitions between tabs
- Maintain scroll position and state within each tab when switching away and back
- Handle deep linking to specific screens within tabs correctly

**Error handling and edge cases**
- Ensure navigation works correctly when user is not authenticated (should redirect to Auth stack)
- Handle navigation state persistence across app restarts (React Navigation handles this automatically)
- Ensure tab navigation doesn't interfere with existing modal flows (LogEntryModal, etc.)
- Test navigation with various screen sizes and orientations

**Accessibility**
- Ensure all tab buttons have proper `accessibilityLabel` attributes
- Support screen reader navigation through tabs
- Ensure minimum touch target sizes (44x44px) for all tab buttons
- Provide clear focus indicators for keyboard navigation (if applicable)

**Testing requirements**
- Add Jest/RNTL tests for tab navigation structure
- Test that each tab navigates to correct root screen
- Test that stack navigation within tabs works correctly
- Test that switching tabs preserves state
- Verify that removing HomeScreen doesn't break any existing navigation flows
- Add Detox E2E tests for critical tab navigation flows

## Visual Design
No visual assets provided. Follow iOS and Android platform conventions for bottom tab bars:
- iOS: Translucent tab bar with blur effect, icons above labels
- Android: Material Design tab bar with icons and labels side-by-side or stacked

## Existing Code to Leverage

**`apps/mobile/src/navigation/MainStack.tsx`**
- Current stack navigator structure to be refactored into tab-based navigation
- Screen wrappers and component patterns remain the same
- Navigation type definitions need updating but follow same patterns

**`apps/mobile/src/navigation/types.ts`**
- Existing type definitions for `MainStackParamList` and `RootStackParamList`
- Update to include `BottomTabParamList` and nested stack types
- Follow same TypeScript navigation patterns established in auth flows

**`apps/mobile/src/navigation/screenWrappers.tsx`**
- All existing screen wrappers can be reused
- Wrappers adapt screens to React Navigation, which works with both stack and tab navigators
- No changes needed to wrapper components themselves

**`apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx`**
- Current dashboard implementation becomes root screen of Dashboard tab
- Back button behavior already handles initial screen case (navigates to Settings)
- Remove back button entirely when dashboard is tab root (users can navigate to Settings via Settings tab)

**`apps/mobile/src/screens/StandardsLibraryScreen.tsx`**
- Standards Library becomes root screen of Standards tab
- Should provide navigation to Standards Builder (via button or action)
- Maintains Active/Archived filtering tabs within the screen

**`apps/mobile/src/screens/StandardsBuilderScreen.tsx`**
- Standards Builder becomes a screen in the Standards tab stack
- Accessible from Standards Library navigation
- May also be accessible from Dashboard (for creating new standards)

**`apps/mobile/src/screens/ActivityLibraryScreen.tsx`**
- Activity Library becomes root screen of Activities tab
- Standalone screen for managing activities
- Remove back button when it's the tab root (users navigate via tabs)

**React Navigation documentation**
- Follow React Navigation v7 patterns for bottom tabs
- Use `createBottomTabNavigator` API consistent with existing `createNativeStackNavigator` usage
- Leverage React Navigation's built-in state persistence and deep linking support

**Existing styling patterns**
- Follow `StyleSheet.create` patterns from existing screens
- Use consistent color tokens and spacing from app's design system
- Match header and navigation styling from `StandardsLibraryScreen` and `SettingsScreen`

## Out of Scope
- Custom tab bar designs beyond platform conventions (use default React Navigation tab bar styling)
- Tab badges or notification indicators (can be added in future iteration)
- Animated tab transitions beyond default React Navigation animations
- Tab reordering or customization by users
- Different tab configurations for different user roles
- Tab bar hiding/showing based on scroll position
- Nested tab navigators (tabs within tabs)
- Tab-specific state persistence beyond React Navigation defaults
- Migration of existing navigation state from old structure (users will start fresh)
