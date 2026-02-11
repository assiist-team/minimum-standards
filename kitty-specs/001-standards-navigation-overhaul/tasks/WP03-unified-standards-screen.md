---
work_package_id: WP03
title: Unified Standards Screen
lane: "doing"
dependencies: [WP01, WP02]
base_branch: 001-standards-navigation-overhaul-WP03-merge-base
base_commit: 39d167268b083e3d84cdefd437f2f8292909ccc8
created_at: '2026-02-11T23:23:26.879649+00:00'
subtasks:
- T011
- T012
- T013
- T014
- T015
- T016
- T017
phase: Phase 1 - Core Features
assignee: ''
agent: ''
shell_pid: "36768"
review_status: ''
reviewed_by: ''
history:
- timestamp: '2026-02-11T22:17:53Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP03 – Unified Standards Screen

## Objectives & Success Criteria

- Merge the Active Standards dashboard and Standards Library into a single unified "Standards" screen.
- Add header menu with "Show Time Bar" and "Show Inactive Standards" toggles that persist across sessions.
- Inactive standards display in a dimmed/muted state with Reactivate, Delete, and View Logs actions via bottom sheet.
- Active standards display with progress bars that can be hidden via the time bar toggle.

**Definition of Done**:
- [ ] Standards tab shows active standards by default (same as current Active screen behavior)
- [ ] Kebab menu offers "Show Time Bar" and "Show Inactive Standards" toggles
- [ ] Toggling "Show Inactive Standards" reveals archived standards below active ones
- [ ] Inactive standards are visually distinct (dimmed/muted)
- [ ] Inactive standard action menu shows Reactivate, Delete, View Logs via bottom sheet
- [ ] Toggling "Show Time Bar" off hides progress bars on all standard cards
- [ ] Both toggles persist across app restarts via AsyncStorage

## Context & Constraints

- **Current Active screen**: `apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx` (31KB) — shows active standards with progress bars, category filters, sort
- **Current Library screen**: `apps/mobile/src/screens/StandardsLibraryScreen.tsx` — shows all standards with search, archive/unarchive/delete
- **Dashboard hook**: `apps/mobile/src/hooks/useActiveStandardsDashboard.ts` — provides `dashboardStandards` with progress calculations
- **Library hook**: `apps/mobile/src/hooks/useStandardsLibrary.ts` — provides `activeStandards`, `archivedStandards`, archive/unarchive/delete operations
- **Standards hook**: `apps/mobile/src/hooks/useStandards.ts` — full CRUD including `archiveStandard()`, `unarchiveStandard()`, `deleteStandard()`
- **UI preferences store**: `apps/mobile/src/stores/uiPreferencesStore.ts` — Zustand store with AsyncStorage persistence
- **Progress card**: `apps/mobile/src/components/StandardProgressCard.tsx` (30KB) — enhanced card with progress bars
- **Standard card**: `apps/mobile/src/components/StandardCard.tsx` (9KB) — simpler card variant
- **BottomSheet components**: Created in WP01 — `BottomSheet.tsx`, `BottomSheetMenu.tsx`, `BottomSheetConfirmation.tsx`
- **Spec requirements**: FR-004, FR-008 through FR-012
- **Implementation command**: `spec-kitty implement WP03 --base WP01`

## Subtasks & Detailed Guidance

### Subtask T011 – Add Show/Hide Toggles to uiPreferencesStore

- **Purpose**: Persist user preferences for time bar visibility and inactive standards visibility across app sessions.

- **Steps**:
  1. Open `apps/mobile/src/stores/uiPreferencesStore.ts`
  2. Add two new fields to the store state:
     ```typescript
     showTimeBar: boolean;           // default: true
     showInactiveStandards: boolean; // default: false
     ```
  3. Add corresponding setter actions:
     ```typescript
     setShowTimeBar: (show: boolean) => void;
     setShowInactiveStandards: (show: boolean) => void;
     ```
  4. Both fields should be included in the persisted state (the store already uses `persist` middleware with AsyncStorage)
  5. Verify the existing persist configuration — add the new fields to the state shape

- **Files**: `apps/mobile/src/stores/uiPreferencesStore.ts` (modify, ~20 lines added)
- **Parallel?**: No — other subtasks depend on these store fields.

- **Validation**:
  - [ ] `showTimeBar` defaults to `true`
  - [ ] `showInactiveStandards` defaults to `false`
  - [ ] Values persist across app restarts (AsyncStorage)
  - [ ] Setters update state reactively

### Subtask T012 – Refactor ActiveStandardsDashboard into Unified StandardsScreen

- **Purpose**: The "Active" screen becomes the unified "Standards" screen, serving as the primary view for all standards.

- **Steps**:
  1. Open `apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx`
  2. Rename the component to `StandardsScreen` (update export and any references)
  3. Keep all existing functionality for active standards: progress bars, category filters, sort options, log entry creation
  4. Update the screen title/header from "Active" to "Standards"
  5. Update the screen wrapper in `apps/mobile/src/navigation/screenWrappers.tsx` to reflect the new name
  6. Update the stack navigator to use the new component name

- **Files**:
  - `apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx` (rename/modify)
  - `apps/mobile/src/navigation/screenWrappers.tsx` (update wrapper name)
  - `apps/mobile/src/navigation/StandardsStack.tsx` (update screen reference)

- **Parallel?**: No — foundation for T013–T017.

- **Notes**: This is a rename + minor refactor, NOT a rewrite. Keep all existing active standards behavior intact.

### Subtask T013 – Add Kebab Menu with Toggle Items

- **Purpose**: The Standards screen needs a header menu (kebab/three-dot) with "Show Time Bar" and "Show Inactive Standards" toggle items.

- **Steps**:
  1. In the Standards screen, add a kebab menu icon in the header (three vertical dots using MaterialIcons `more-vert`)
  2. Tapping the kebab opens a `BottomSheetMenu` (from WP01) with two toggle items:
     - "Show Time Bar" — shows a checkmark when enabled
     - "Show Inactive Standards" — shows a checkmark when enabled
  3. Connect to `uiPreferencesStore`:
     ```typescript
     const { showTimeBar, setShowTimeBar, showInactiveStandards, setShowInactiveStandards } = useUIPreferencesStore();
     ```
  4. Toggle items: tapping toggles the boolean and the checkmark updates immediately
  5. All menu labels in Title Case (FR-016)
  6. Add state for menu visibility: `const [menuVisible, setMenuVisible] = useState(false);`

- **Files**: `apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx` (modify, ~40 lines added)
- **Parallel?**: No — depends on T011 (store) and T012 (screen rename).

- **Notes**: The menu items are toggles, not navigation actions. Consider using a checkmark icon (`check` MaterialIcons) to indicate the current state, or use a custom toggle row in the BottomSheetMenu.

### Subtask T014 – Fetch and Render Inactive Standards

- **Purpose**: When "Show Inactive Standards" is toggled on, display archived standards below the active standards list.

- **Steps**:
  1. Import `useStandards` or `useStandardsLibrary` hook to access `archivedStandards`
  2. Conditionally render a section below active standards when `showInactiveStandards` is true:
     ```tsx
     {showInactiveStandards && archivedStandards.length > 0 && (
       <View>
         <Text style={styles.sectionHeader}>Inactive Standards</Text>
         {archivedStandards.map(standard => (
           <InactiveStandardCard key={standard.id} standard={standard} ... />
         ))}
       </View>
     )}
     ```
  3. Add a section header "Inactive Standards" above the inactive list with appropriate styling
  4. If the active standards list uses `FlatList`, consider switching to `SectionList` or rendering inactive standards in the `ListFooterComponent`
  5. Handle empty state: if `showInactiveStandards` is on but there are no archived standards, show nothing (no empty state message)

- **Files**: `apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx` (modify, ~30 lines added)
- **Parallel?**: No — depends on T012, T013.

- **Notes**: The existing `useStandards` hook provides both `activeStandards` and `archivedStandards` — use the `archivedStandards` array directly.

### Subtask T015 – Dimmed/Muted Styling for Inactive Cards

- **Purpose**: Inactive standards must be visually distinct from active standards per FR-010.

- **Steps**:
  1. When rendering inactive standard cards, apply visual differentiation:
     - Reduce opacity to 0.6 on the entire card
     - Apply a muted background color (slightly grey/faded)
     - Optionally add an "Inactive" badge/label in the card corner
  2. You can either:
     - Create a wrapper `InactiveStandardCard` component that wraps `StandardCard` with opacity
     - Or pass an `inactive` prop to existing `StandardCard` and handle styling internally
  3. Inactive cards should NOT show progress bars (they have no active period)
  4. Inactive cards should still show: activity name, volume/period summary, category

- **Files**:
  - `apps/mobile/src/components/StandardCard.tsx` (modify — add `inactive` prop) OR
  - `apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx` (wrap with opacity View)

- **Parallel?**: Yes — can be built independently once T012 baseline exists.

- **Validation**:
  - [ ] Inactive cards are visually distinguishable at a glance
  - [ ] Opacity or muted colors applied
  - [ ] No progress bars on inactive cards

### Subtask T016 – Inactive Standard Action Menu

- **Purpose**: Each inactive standard needs an action menu with Reactivate, Delete, and View Logs options per FR-011.

- **Steps**:
  1. Add a three-dot menu button to inactive standard cards
  2. Tapping opens a `BottomSheetMenu` with three items:
     - "Reactivate" (icon: `replay` or `restore`) — calls `unarchiveStandard(standardId)` from `useStandards`
     - "Delete" (icon: `delete`, destructive: true) — opens `BottomSheetConfirmation` then calls `deleteStandard(standardId)`
     - "View Logs" (icon: `history` or `list`) — navigates to `StandardPeriodActivityLogsScreen` with the standard's ID
  3. After Reactivate: standard moves from inactive to active list (automatic via Firestore subscription)
  4. After Delete: confirmation dialog → "Are you sure you want to delete this standard? This cannot be undone." → call `deleteStandard()`
  5. All labels in Title Case

- **Files**: `apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx` (modify, ~50 lines)
- **Parallel?**: No — depends on BottomSheet components (WP01) and inactive rendering (T014).

- **Validation**:
  - [ ] Tapping three-dot on inactive card opens bottom sheet
  - [ ] "Reactivate" moves standard to active list
  - [ ] "Delete" shows confirmation then removes standard
  - [ ] "View Logs" navigates to logs screen

### Subtask T017 – Time Bar Visibility Toggle on Cards

- **Purpose**: When "Show Time Bar" is toggled off, hide progress bars on standard cards per FR-008.

- **Steps**:
  1. In the Standards screen, pass `showTimeBar` from `uiPreferencesStore` to `StandardProgressCard`:
     ```tsx
     <StandardProgressCard
       standard={standard}
       showTimeBar={showTimeBar}
       ...
     />
     ```
  2. In `StandardProgressCard.tsx`, accept `showTimeBar` prop and conditionally render the progress bar section:
     ```tsx
     {showTimeBar && (
       <View style={styles.progressBarContainer}>
         {/* existing progress bar rendering */}
       </View>
     )}
     ```
  3. When hidden, the card should collapse smoothly — no empty space where the bar was

- **Files**:
  - `apps/mobile/src/components/StandardProgressCard.tsx` (modify — add `showTimeBar` prop, ~10 lines)
  - `apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx` (modify — pass prop)

- **Parallel?**: Yes — can proceed independently once T011 (store) and T012 (screen) exist.

- **Validation**:
  - [ ] Toggle "Show Time Bar" off → progress bars disappear from all cards
  - [ ] Toggle back on → progress bars reappear
  - [ ] Card layout adjusts cleanly (no empty gaps)

## Risks & Mitigations

- **ActiveStandardsDashboardScreen is 31KB**: Large file with many responsibilities. Keep changes surgical — add to it rather than rewriting. Avoid breaking existing behavior for active standards.
- **FlatList vs SectionList**: If the current screen uses `FlatList`, adding an inactive section below may require switching to `SectionList` or using `ListFooterComponent`. Test scroll performance with many standards.
- **Hook composition**: The screen may need both `useActiveStandardsDashboard` (for progress data) and `useStandards` (for archived standards). Verify these hooks don't conflict or cause double-fetching.

## Review Guidance

- Verify active standards display exactly as before (no regression)
- Toggle "Show Inactive Standards" on — confirm inactive standards appear below active ones
- Verify inactive cards are visually distinct at a glance
- Test each inactive action: Reactivate, Delete (with confirmation), View Logs
- Toggle "Show Time Bar" off — confirm progress bars hide across all cards
- Kill app and relaunch — confirm toggles persist
- Test with 0 active standards, 0 inactive standards, many of both

## Activity Log

- 2026-02-11T22:17:53Z – system – lane=planned – Prompt created.
