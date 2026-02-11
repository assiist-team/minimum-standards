---
work_package_id: WP06
title: Bottom Sheet Menu Migration
lane: "doing"
dependencies: [WP01, WP03]
base_branch: 001-standards-navigation-overhaul-WP06-merge-base
base_commit: ae533d45b738150b79a6ef55314c960799c5ef38
created_at: '2026-02-11T23:39:34.413251+00:00'
subtasks:
- T031
- T032
- T033
- T034
- T035
- T036
phase: Phase 3 - Polish P2
assignee: ''
agent: ''
shell_pid: "71324"
review_status: ''
reviewed_by: ''
history:
- timestamp: '2026-02-11T22:17:53Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP06 – Bottom Sheet Menu Migration

## Objectives & Success Criteria

- Replace ALL `Alert.alert()` action/confirmation dialogs and custom overlay menus with BottomSheet-based equivalents.
- Ensure 100% of menus and action dialogs render as bottom sheets (SC-003).
- All menu item labels use Title Case (FR-016).

**Definition of Done**:
- [ ] Zero `Alert.alert()` calls remain for action menus or confirmations (grep verification)
- [ ] All sort menus render as bottom sheets
- [ ] All category management dialogs render as bottom sheets
- [ ] All delete/archive/deactivate confirmations render as bottom sheet confirmations
- [ ] All menu item labels use Title Case
- [ ] No custom overlay menus remain

## Context & Constraints

- **BottomSheet components**: Created in WP01 — `BottomSheet.tsx`, `BottomSheetMenu.tsx`, `BottomSheetConfirmation.tsx`
- **Spec requirements**: FR-013, FR-014, FR-015, FR-016, SC-003
- **Known Alert.alert() locations** (from codebase scan):
  - `StandardsLibraryScreen.tsx` — delete/archive confirmations
  - `StandardsBuilderScreen.tsx` — discard changes, validation errors
  - `ActivitySettingsScreen.tsx` — delete activity confirmation
  - `CategorySettingsScreen.tsx` — delete category confirmation
  - `ActiveStandardsDashboardScreen.tsx` — archive confirmation
  - Various screens may have error alerts (these can remain as system alerts or be converted to ErrorBanner)
- **Scope clarification**: The spec says "All action menus, sort menus, and confirmation dialogs" — error-only alerts (showing a message with just "OK") are NOT required to be bottom sheets. Focus on interactive dialogs with choices.
- **Implementation command**: `spec-kitty implement WP06 --base WP01`

## Subtasks & Detailed Guidance

### Subtask T031 – Audit All Alert.alert() and Overlay Menus

- **Purpose**: Create a comprehensive inventory of every `Alert.alert()` call and custom overlay/modal menu that needs migration.

- **Steps**:
  1. Search the codebase for all `Alert.alert(` calls:
     ```bash
     grep -rn "Alert.alert(" apps/mobile/src/ --include="*.tsx" --include="*.ts"
     ```
  2. For each match, classify as:
     - **Action confirmation** (2+ buttons, user makes a choice) → migrate to BottomSheetConfirmation
     - **Error/info alert** (single "OK" button, informational) → keep as Alert or migrate to ErrorBanner
     - **Action menu** (list of choices) → migrate to BottomSheetMenu
  3. Search for custom overlay/modal menus:
     ```bash
     grep -rn "Modal" apps/mobile/src/ --include="*.tsx" | grep -i "menu\|action\|option"
     ```
  4. Document findings as inline comments or a migration checklist in the PR description
  5. **Do NOT migrate yet** — this subtask is audit only. Migrations happen in T032–T035.

- **Files**: No file changes — audit only. Document findings.
- **Parallel?**: No — informs T032–T035.

### Subtask T032 – Replace Standard Card Action Menus

- **Purpose**: Convert the three-dot menus on standard cards from their current implementation to `BottomSheetMenu`.

- **Steps**:
  1. Open `apps/mobile/src/components/StandardCard.tsx` and/or `StandardProgressCard.tsx`
  2. Find the current action menu implementation (likely an `Alert.alert()` or custom overlay)
  3. Replace with `BottomSheetMenu`:
     ```tsx
     const [menuVisible, setMenuVisible] = useState(false);

     <BottomSheetMenu
       visible={menuVisible}
       onRequestClose={() => setMenuVisible(false)}
       items={[
         { key: 'edit', label: 'Edit', icon: 'edit', onPress: handleEdit },
         { key: 'archive', label: 'Deactivate', icon: 'archive', onPress: handleArchive },
         { key: 'delete', label: 'Delete', icon: 'delete', onPress: handleDelete, destructive: true },
       ]}
     />
     ```
  4. The three-dot button's `onPress` should set `menuVisible = true`
  5. All labels in Title Case

- **Files**:
  - `apps/mobile/src/components/StandardCard.tsx` (modify)
  - `apps/mobile/src/components/StandardProgressCard.tsx` (modify)

- **Parallel?**: Yes — independent of T033, T034.

### Subtask T033 – Replace Sort Menu Overlays

- **Purpose**: Convert sort/filter menus on the Standards screen from overlays to bottom sheets.

- **Steps**:
  1. In the Standards screen (formerly `ActiveStandardsDashboardScreen`), find the sort menu implementation
  2. The current sort menu likely uses a custom dropdown or Alert — replace with `BottomSheetMenu`:
     ```tsx
     <BottomSheetMenu
       visible={sortMenuVisible}
       onRequestClose={() => setSortMenuVisible(false)}
       title="Sort By"
       items={[
         { key: 'name', label: 'Name', icon: sortBy === 'name' ? 'check' : undefined, onPress: () => setSortBy('name') },
         { key: 'progress', label: 'Progress', icon: sortBy === 'progress' ? 'check' : undefined, onPress: () => setSortBy('progress') },
         { key: 'recent', label: 'Most Recent', icon: sortBy === 'recent' ? 'check' : undefined, onPress: () => setSortBy('recent') },
       ]}
     />
     ```
  3. Show a checkmark on the currently selected sort option

- **Files**: `apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx` (modify)
- **Parallel?**: Yes — independent of T032, T034.

### Subtask T034 – Replace Category Management Dialogs

- **Purpose**: Convert category management dialogs (create, edit, delete, reorder) from Alert/Modal to bottom sheets.

- **Steps**:
  1. Open `apps/mobile/src/screens/CategorySettingsScreen.tsx` (43KB — large file)
  2. Find all `Alert.alert()` calls for:
     - Delete category confirmation
     - Category action menus (edit, delete, reorder)
  3. Replace delete confirmation with `BottomSheetConfirmation`:
     ```tsx
     <BottomSheetConfirmation
       visible={deleteConfirmVisible}
       onRequestClose={() => setDeleteConfirmVisible(false)}
       title="Delete Category"
       message="Are you sure you want to delete this category? Activities in this category will become uncategorized."
       confirmLabel="Delete"
       destructive
       onConfirm={handleDeleteCategory}
     />
     ```
  4. Replace action menus with `BottomSheetMenu`
  5. Also check `ActivitySettingsScreen.tsx` (20KB) for similar patterns

- **Files**:
  - `apps/mobile/src/screens/CategorySettingsScreen.tsx` (modify)
  - `apps/mobile/src/screens/ActivitySettingsScreen.tsx` (modify)

- **Parallel?**: Yes — independent of T032, T033.

### Subtask T035 – Replace Remaining Alert.alert() Confirmations

- **Purpose**: Catch any remaining `Alert.alert()` calls used for action confirmations that weren't covered in T032–T034.

- **Steps**:
  1. Re-run the grep from T031 to find any remaining `Alert.alert()` calls
  2. For each remaining action confirmation (2+ button dialogs), replace with `BottomSheetConfirmation`
  3. Common remaining locations:
     - `StandardsBuilderScreen.tsx` — discard changes confirmation when navigating away
     - Any screen with archive/unarchive actions
  4. Leave pure informational alerts (single "OK" button for errors) as-is or convert to `ErrorBanner`
  5. Verify zero `Alert.alert()` calls remain for interactive dialogs:
     ```bash
     grep -rn "Alert.alert(" apps/mobile/src/ --include="*.tsx" | grep -v "// error-only"
     ```

- **Files**: Various screens (modify as needed based on audit findings)
- **Parallel?**: No — depends on T031 audit and T032–T034 completing first.

### Subtask T036 – Audit Menu Labels for Title Case

- **Purpose**: Ensure all menu item labels across the app conform to Title Case per FR-016.

- **Steps**:
  1. Review all `BottomSheetMenu` and `BottomSheetConfirmation` instances created in this WP and WP03
  2. Verify Title Case: capitalize first letter of each word, lowercase prepositions
     - Correct: "View Logs", "Delete Standard", "Show Time Bar", "Break Volume into Sessions"
     - Incorrect: "view logs", "DELETE STANDARD", "show time bar"
  3. Check button labels: "Edit", "Deactivate", "Delete", "Categorize", "Reactivate", "View Logs"
  4. Check toggle labels: "Show Time Bar", "Show Inactive Standards"
  5. Check confirmation buttons: "Delete", "Cancel", "Confirm", "Deactivate"
  6. Fix any labels that don't conform

- **Files**: All files modified in WP03, WP06, and any remaining screens
- **Parallel?**: No — final verification after all migrations.

- **Validation**:
  - [ ] Every menu item label uses Title Case
  - [ ] Every confirmation button label uses Title Case
  - [ ] Every toggle label uses Title Case

## Risks & Mitigations

- **Missed Alert.alert() calls**: The codebase may have alerts in files not immediately obvious. The T031 audit mitigates this — be thorough.
- **Error alerts vs action alerts**: Be careful not to convert informational error alerts to bottom sheets — they're a different UX pattern. Only convert interactive dialogs with choices.
- **CategorySettingsScreen complexity**: At 43KB, this screen is large. Make surgical changes — replace only the Alert.alert() calls, don't refactor surrounding code.

## Review Guidance

- Run `grep -rn "Alert.alert(" apps/mobile/src/` — verify zero matches for interactive dialogs
- Trigger every menu in the app: standard card menu, sort menu, category menu, delete confirmations
- Verify all render as bottom sheets with correct styling
- Check all labels are Title Case
- Test backdrop dismiss on every bottom sheet
- Verify destructive confirmations (delete, deactivate) show the red confirm button

## Activity Log

- 2026-02-11T22:17:53Z – system – lane=planned – Prompt created.
