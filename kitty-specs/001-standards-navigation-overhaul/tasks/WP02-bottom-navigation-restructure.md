---
work_package_id: WP02
title: Bottom Navigation Restructure
lane: "doing"
dependencies: []
base_branch: main
base_commit: 7215f69959f0bebaf19e41bccb31613748c7cc77
created_at: '2026-02-11T23:01:55.425772+00:00'
subtasks:
- T004
- T005
- T006
- T007
- T008
- T009
- T010
phase: Phase 0 - Foundation
assignee: ''
agent: ''
shell_pid: "91038"
review_status: ''
reviewed_by: ''
history:
- timestamp: '2026-02-11T22:17:53Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP02 – Bottom Navigation Restructure

## Objectives & Success Criteria

- Restructure the bottom tab navigation to display exactly four items: **Standards**, **Scorecard**, **Settings**, **+ (Create)**.
- Remove the Library tab, floating Log button, and all associated dead navigation code.
- The Standards tab uses the `pending-actions` MaterialIcons icon.
- The "+" button opens the Create Standard flow.

**Definition of Done**:
- [ ] Bottom nav shows exactly 4 items in correct order: Standards, Scorecard, Settings, +
- [ ] Standards tab uses `pending-actions` icon
- [ ] Scorecard tab uses a new distinct icon
- [ ] "+" button navigates to Create Standard flow
- [ ] No floating Log button above the tab bar
- [ ] No Library tab or screen in navigation
- [ ] Navigation types updated, no TypeScript errors
- [ ] Existing navigation tests updated or removed

## Context & Constraints

- **Current navigation**: `apps/mobile/src/navigation/BottomTabNavigator.tsx` — renders Dashboard, Standards (Library), Activities (Scorecard), Settings tabs + StickyLogButton
- **Navigation stacks**: `DashboardStack.tsx`, `StandardsStack.tsx`, `ActivitiesStack.tsx`, `SettingsStack.tsx`
- **Screen wrappers**: `apps/mobile/src/navigation/screenWrappers.tsx` — adapter functions connecting React Navigation to screens
- **Type definitions**: `apps/mobile/src/navigation/types.ts` — `BottomTabParamList`, stack param lists
- **Spec requirements**: FR-001 through FR-007
- **Dependencies**: React Navigation `@react-navigation/bottom-tabs` v6, `@react-navigation/native-stack` v6
- **Implementation command**: `spec-kitty implement WP02`

## Subtasks & Detailed Guidance

### Subtask T004 – Update BottomTabNavigator to 4 Tabs

- **Purpose**: Restructure the tab bar to match the new layout: Standards | Scorecard | Settings | +

- **Steps**:
  1. Open `apps/mobile/src/navigation/BottomTabNavigator.tsx`
  2. Remove the "Dashboard" tab (currently renders `DashboardStack` with `star` icon)
  3. Rename the "Standards" tab (currently Library) to keep as the primary "Standards" tab
  4. Rename the "Activities" tab to "Scorecard"
  5. Keep "Settings" tab unchanged
  6. Add a "+" tab as the fourth item — this is NOT a real tab screen but a button that triggers navigation:
     ```typescript
     <Tab.Screen
       name="Create"
       component={EmptyScreen}  // placeholder - never renders
       options={{
         tabBarLabel: '',
         tabBarIcon: ({ color, size }) => (
           <MaterialIcons name="add" size={size} color={color} />
         ),
       }}
       listeners={({ navigation }) => ({
         tabPress: (e) => {
           e.preventDefault(); // Don't navigate to a tab
           navigation.navigate('StandardsBuilder'); // or CreateStandardFlow
         },
       })}
     />
     ```
  7. Tab order: Standards (index 0), Scorecard (index 1), Settings (index 2), Create/+ (index 3, rightmost)
  8. Create a minimal `EmptyScreen` component (or use a View) as placeholder for the Create tab since it never renders

- **Files**: `apps/mobile/src/navigation/BottomTabNavigator.tsx` (modify)
- **Parallel?**: No — other subtasks depend on this structure.

- **Notes**: The "+" button pattern with `tabPress` listener and `e.preventDefault()` is a common React Navigation pattern for action buttons in tab bars.

### Subtask T005 – Change Standards Tab Icon

- **Purpose**: The Standards tab must use the `pending-actions` MaterialIcons icon per FR-005.

- **Steps**:
  1. In `BottomTabNavigator.tsx`, update the Standards tab's `tabBarIcon` to use `pending-actions`
  2. Verify the icon renders correctly at the tab bar's default size

- **Files**: `apps/mobile/src/navigation/BottomTabNavigator.tsx` (modify, same file as T004)
- **Parallel?**: No — part of T004 changes.

- **Validation**:
  - [ ] Standards tab shows `pending-actions` icon
  - [ ] Icon renders at correct size and color for both active and inactive states

### Subtask T006 – Change Scorecard Tab Icon

- **Purpose**: The Scorecard tab must display a new, distinct icon per FR-006.

- **Steps**:
  1. Choose an appropriate MaterialIcons icon for Scorecard (suggestions: `assessment`, `bar-chart`, `leaderboard`, `scoreboard`)
  2. Update the Scorecard tab's `tabBarIcon` in `BottomTabNavigator.tsx`
  3. The current Activities/Scorecard tab uses `task-alt` — replace with the new icon

- **Files**: `apps/mobile/src/navigation/BottomTabNavigator.tsx` (modify)
- **Parallel?**: No — part of T004 changes.

- **Validation**:
  - [ ] Scorecard tab shows a new, distinct icon (not `task-alt`)
  - [ ] Icon is visually distinct from Standards (`pending-actions`) and Settings (`settings`)

### Subtask T007 – Wire "+" Button to Create Standard Flow

- **Purpose**: Tapping the "+" button must open the Create Standard flow per FR-007.

- **Steps**:
  1. In the "+" tab's `tabPress` listener, navigate to the StandardsBuilder screen (existing) or the new CreateStandardFlow (from WP04, if already merged)
  2. For now, navigate to `StandardsBuilder` in the `StandardsStack`:
     ```typescript
     navigation.navigate('Standards', {
       screen: 'StandardsBuilder',
     });
     ```
  3. If `CreateStandardFlow` from WP04 is available, navigate to that instead
  4. Ensure the navigation works from any tab (not just Standards)

- **Files**: `apps/mobile/src/navigation/BottomTabNavigator.tsx` (modify)
- **Parallel?**: No — depends on T004 structure.

- **Notes**: The exact target screen may change once WP04 lands. For now, wire to the existing `StandardsBuilder` screen. WP04 will update the target.

### Subtask T008 – Remove StickyLogButton

- **Purpose**: The floating Log button above the tab bar must be removed per FR-003.

- **Steps**:
  1. In `BottomTabNavigator.tsx`, find and remove the `StickyLogButton` component rendering
  2. Remove the `StickyLogButton` import
  3. Check if `StickyLogButton.tsx` component is used anywhere else — if not, it will be deleted in WP08 cleanup
  4. Remove any associated state or handlers for the sticky log button in the navigator

- **Files**: `apps/mobile/src/navigation/BottomTabNavigator.tsx` (modify)
- **Parallel?**: No — part of navigator changes.

- **Validation**:
  - [ ] No floating button above the tab bar on any screen
  - [ ] No visual gap or layout issue where the button used to be

### Subtask T009 – Remove StandardsLibraryScreen from Navigation

- **Purpose**: The Standards Library screen must be removed per FR-002. The unified Standards screen (WP03) replaces it.

- **Steps**:
  1. Open `apps/mobile/src/navigation/StandardsStack.tsx`
  2. Remove the `StandardsLibrary` screen from the stack navigator
  3. The stack should now contain: Standards (main screen) and StandardsBuilder (for editing)
  4. Update `DashboardStack.tsx` — if it still exists and references the old dashboard screen, merge its routes into StandardsStack or remove it
  5. Update `screenWrappers.tsx` — remove `StandardsLibraryScreenWrapper` if present
  6. Remove any navigation routes that reference `StandardsLibrary` from other stacks

- **Files**:
  - `apps/mobile/src/navigation/StandardsStack.tsx` (modify)
  - `apps/mobile/src/navigation/DashboardStack.tsx` (modify or remove)
  - `apps/mobile/src/navigation/screenWrappers.tsx` (modify)

- **Parallel?**: No — depends on T004 navigation structure.

- **Notes**: The `StandardsLibraryScreen.tsx` file itself is not deleted here — that's in WP08 cleanup. This subtask only removes it from navigation.

### Subtask T010 – Update Navigation Type Definitions

- **Purpose**: Keep TypeScript types in sync with the new navigation structure.

- **Steps**:
  1. Open `apps/mobile/src/navigation/types.ts`
  2. Update `BottomTabParamList`:
     ```typescript
     export type BottomTabParamList = {
       Standards: NavigatorScreenParams<StandardsStackParamList>;
       Scorecard: NavigatorScreenParams<ScorecardStackParamList>;
       SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
       Create: undefined;  // Never navigated to directly
     };
     ```
  3. Remove `DashboardStackParamList` if Dashboard stack is removed
  4. Rename `ActivitiesStackParamList` to `ScorecardStackParamList` (or alias)
  5. Update `StandardsStackParamList` to remove `StandardsLibrary` route
  6. Update the global `ReactNavigation.RootParamList` declaration if it references changed types
  7. Fix any TypeScript errors that arise from the type changes across the codebase
  8. Update `AppNavigator.tsx` if it references changed stack names

- **Files**:
  - `apps/mobile/src/navigation/types.ts` (modify)
  - `apps/mobile/src/navigation/AppNavigator.tsx` (modify if needed)
  - Any file importing removed/renamed types

- **Parallel?**: Yes — can proceed once T004 structure is finalized.

- **Notes**: Run `npx tsc --noEmit` to find all type errors after changes.

## Risks & Mitigations

- **Navigation test failures**: Existing tests in `apps/mobile/src/navigation/__tests__/` will break. Update `BottomTabNavigator.test.tsx` and `tabNavigation.test.tsx` to reflect the new 4-tab structure. Remove tests for removed screens.
- **Deep link breakage**: If the app uses deep links that reference `Dashboard` or `Library`, those routes will break. Check `linking` config in `AppNavigator.tsx`.
- **Screen wrapper orphans**: `screenWrappers.tsx` may have wrapper functions for removed screens. Clean up to avoid confusion (but don't delete the actual screen files yet — that's WP08).

## Review Guidance

- Verify bottom nav shows exactly 4 items on both iOS and Android
- Confirm "+" button intercepts tab press and navigates to builder (does NOT show a tab screen)
- Check that tapping "+" from any tab works correctly
- Verify no floating Log button anywhere in the app
- Confirm TypeScript compiles without errors (`npx tsc --noEmit`)
- Verify navigation tests pass (or are updated)

## Activity Log

- 2026-02-11T22:17:53Z – system – lane=planned – Prompt created.
