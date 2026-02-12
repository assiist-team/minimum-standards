---
work_package_id: WP07
title: Active Standard Card Actions
lane: "doing"
dependencies: [WP01, WP03, WP04]
base_branch: 001-standards-navigation-overhaul-WP07-merge-base
base_commit: 06b2b73f16c31c485371bfcd6d1bfd02267f8e14
created_at: '2026-02-11T23:54:52.399629+00:00'
subtasks:
- T037
- T038
- T039
- T040
- T041
phase: Phase 3 - Polish P2
assignee: ''
agent: "claude-opus"
shell_pid: "30161"
review_status: ''
reviewed_by: ''
history:
- timestamp: '2026-02-11T22:17:53Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP07 – Active Standard Card Actions

## Objectives & Success Criteria

- Implement a bottom sheet action menu for active standard cards with four options: Edit, Deactivate, Delete, Categorize.
- Wire each action to its corresponding behavior with appropriate confirmations.

**Definition of Done**:
- [ ] Tapping three-dot menu on active standard card opens a bottom sheet
- [ ] Bottom sheet shows "Edit", "Deactivate", "Delete", "Categorize" in Title Case
- [ ] "Edit" navigates to Create Standard flow pre-populated with the standard's data
- [ ] "Deactivate" shows confirmation then archives the standard
- [ ] "Delete" shows confirmation then permanently deletes the standard
- [ ] "Categorize" opens a category picker and updates the standard's activity category

## Context & Constraints

- **Standard card components**:
  - `apps/mobile/src/components/StandardCard.tsx` (9KB) — simpler card
  - `apps/mobile/src/components/StandardProgressCard.tsx` (30KB) — enhanced card with progress
- **Standards hook**: `apps/mobile/src/hooks/useStandards.ts` — `archiveStandard()`, `deleteStandard()`, `updateStandard()`
- **Activities hook**: `apps/mobile/src/hooks/useActivities.ts` — `updateActivity()` for category changes
- **Categories hook**: `apps/mobile/src/hooks/useCategories.ts` — category list for picker
- **Builder store**: `apps/mobile/src/stores/standardsBuilderStore.ts` — for pre-populating edit mode
- **BottomSheet components**: From WP01 — `BottomSheetMenu.tsx`, `BottomSheetConfirmation.tsx`
- **Create Standard flow**: From WP04 — `CreateStandardFlow` navigator
- **Spec requirements**: User Story 5 acceptance scenarios
- **Implementation command**: `spec-kitty implement WP07 --base WP01`

## Subtasks & Detailed Guidance

### Subtask T037 – Create Active Standard Action Bottom Sheet

- **Purpose**: Replace the current action menu on active standard cards with a bottom sheet showing Edit, Deactivate, Delete, and Categorize options.

- **Steps**:
  1. In the Standards screen (or in `StandardProgressCard` / `StandardCard`), add state for the action sheet:
     ```typescript
     const [actionSheetVisible, setActionSheetVisible] = useState(false);
     const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);
     ```
  2. When the three-dot menu button is tapped on any active standard card:
     ```typescript
     const handleMenuPress = (standard: Standard) => {
       setSelectedStandard(standard);
       setActionSheetVisible(true);
     };
     ```
  3. Render the `BottomSheetMenu`:
     ```tsx
     <BottomSheetMenu
       visible={actionSheetVisible}
       onRequestClose={() => setActionSheetVisible(false)}
       items={[
         { key: 'edit', label: 'Edit', icon: 'edit', onPress: handleEdit },
         { key: 'deactivate', label: 'Deactivate', icon: 'archive', onPress: handleDeactivate },
         { key: 'delete', label: 'Delete', icon: 'delete', onPress: handleDelete, destructive: true },
         { key: 'categorize', label: 'Categorize', icon: 'category', onPress: handleCategorize },
       ]}
     />
     ```
  4. All labels in Title Case per FR-016

- **Files**:
  - `apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx` (modify) OR
  - `apps/mobile/src/components/StandardProgressCard.tsx` (modify)

- **Parallel?**: No — foundation for T038–T041.

- **Notes**: Decide whether the action sheet state lives in the screen (parent) or the card component. If in the screen, the card must emit an event (callback prop) when the menu button is tapped. If in the card, each card manages its own sheet.

### Subtask T038 – Wire Edit to Pre-Populated Create Flow

- **Purpose**: "Edit" should navigate to the Create Standard flow with the standard's current data pre-populated per US5 acceptance scenario 2.

- **Steps**:
  1. When "Edit" is pressed:
     ```typescript
     const handleEdit = () => {
       if (!selectedStandard) return;
       // Load standard data into builder store
       const store = useStandardsBuilderStore.getState();
       // Find the activity for this standard
       const activity = activities.find(a => a.id === selectedStandard.activityId);
       if (activity) {
         store.setSelectedActivity(activity);
       }
       store.setGoalTotal(String(selectedStandard.minimum));
       store.setCadence(selectedStandard.cadence);
       if (selectedStandard.sessionConfig) {
         store.setBreakdownEnabled(true);
         store.setSessionsPerCadence(selectedStandard.sessionConfig.sessionsPerCadence);
         store.setVolumePerSession(selectedStandard.sessionConfig.volumePerSession);
       }
       // Navigate to Create flow in edit mode
       navigation.navigate('CreateStandardFlow', { standardId: selectedStandard.id });
     };
     ```
  2. The Create Standard flow should detect the `standardId` param and:
     - Show "Edit Standard" instead of "Create Standard" as the flow title
     - On final submission, call `updateStandard()` instead of `createStandard()`
  3. Verify the builder store setter methods match what's available — read `standardsBuilderStore.ts` for exact API

- **Files**:
  - `apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx` (modify)
  - `apps/mobile/src/navigation/CreateStandardFlow.tsx` (modify — add `standardId` param handling)
  - `apps/mobile/src/screens/create-standard/SetPeriodStep.tsx` (modify — update vs create logic)

- **Parallel?**: No — depends on T037.

- **Notes**: The existing `StandardsBuilderScreen` already supports edit mode via `standardId` prop. Study how it loads existing data to replicate the pattern.

### Subtask T039 – Wire Deactivate with Confirmation

- **Purpose**: "Deactivate" archives the standard after user confirmation per US5 acceptance scenario 3.

- **Steps**:
  1. When "Deactivate" is pressed, show a `BottomSheetConfirmation`:
     ```tsx
     <BottomSheetConfirmation
       visible={deactivateConfirmVisible}
       onRequestClose={() => setDeactivateConfirmVisible(false)}
       title="Deactivate Standard"
       message="This standard will be moved to inactive. You can reactivate it later from the inactive standards list."
       confirmLabel="Deactivate"
       destructive
       onConfirm={async () => {
         if (selectedStandard) {
           await archiveStandard(selectedStandard.id);
         }
       }}
     />
     ```
  2. After deactivation, the standard disappears from the active list (Firestore subscription handles this)
  3. If "Show Inactive Standards" is on, the standard appears in the inactive section

- **Files**: `apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx` (modify, ~20 lines)
- **Parallel?**: No — depends on T037.

- **Validation**:
  - [ ] Confirmation dialog appears with clear messaging
  - [ ] Confirming archives the standard
  - [ ] Standard moves from active to inactive list

### Subtask T040 – Wire Delete with Confirmation

- **Purpose**: "Delete" permanently removes the standard after user confirmation.

- **Steps**:
  1. When "Delete" is pressed, show a `BottomSheetConfirmation`:
     ```tsx
     <BottomSheetConfirmation
       visible={deleteConfirmVisible}
       onRequestClose={() => setDeleteConfirmVisible(false)}
       title="Delete Standard"
       message="Are you sure you want to delete this standard? This action cannot be undone. All associated logs will be preserved."
       confirmLabel="Delete"
       destructive
       onConfirm={async () => {
         if (selectedStandard) {
           await deleteStandard(selectedStandard.id);
         }
       }}
     />
     ```
  2. After deletion, the standard is removed from the list
  3. Deletion is a soft-delete (`deletedAtMs` set) per the existing `deleteStandard()` behavior

- **Files**: `apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx` (modify, ~20 lines)
- **Parallel?**: No — depends on T037.

### Subtask T041 – Wire Categorize to Category Picker

- **Purpose**: "Categorize" allows users to change the category of the standard's activity.

- **Steps**:
  1. When "Categorize" is pressed, show a `BottomSheetMenu` with all available categories:
     ```typescript
     const { categories } = useCategories();
     const categoryItems: BottomSheetMenuItem[] = [
       { key: 'none', label: 'None', onPress: () => updateCategory(null) },
       ...categories.map(cat => ({
         key: cat.id,
         label: cat.name,
         icon: currentCategoryId === cat.id ? 'check' : undefined,
         onPress: () => updateCategory(cat.id),
       })),
     ];
     ```
  2. Current category is indicated with a checkmark
  3. "None" option at the top removes the category assignment
  4. `updateCategory` updates the activity's `categoryId`:
     ```typescript
     const { updateActivity } = useActivities();
     const updateCategory = async (categoryId: string | null) => {
       if (selectedStandard) {
         await updateActivity(selectedStandard.activityId, { categoryId });
       }
     };
     ```
  5. Category change is reflected immediately in the standards list (activity data updates via subscription)

- **Files**: `apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx` (modify, ~30 lines)
- **Parallel?**: No — depends on T037.

- **Validation**:
  - [ ] Category picker shows all categories + "None"
  - [ ] Current category has a checkmark
  - [ ] Selecting a category updates the standard's activity
  - [ ] Change is reflected in the UI immediately

## Risks & Mitigations

- **Multiple bottom sheets**: This WP introduces 3 bottom sheets (action menu, deactivate confirmation, delete confirmation, category picker). Ensure only one is visible at a time. Use state management to chain them: action menu closes → confirmation opens.
- **Edit mode in Create flow**: Pre-populating the builder store requires knowing the exact setter methods. Read `standardsBuilderStore.ts` carefully — method names may differ from what's assumed here.
- **Category update scope**: Updating an activity's category affects ALL standards using that activity. This is intentional per the data model (category is on Activity, not Standard).

## Review Guidance

- Test each action: Edit, Deactivate, Delete, Categorize
- Verify Edit loads all standard data correctly in the Create flow
- Verify confirmations appear for Deactivate and Delete
- Test that Deactivate moves the standard to inactive (toggle "Show Inactive Standards" to verify)
- Test that Delete removes the standard permanently
- Test Categorize: change category, verify update across all standards using that activity
- Check that bottom sheets don't stack (action menu dismisses before confirmation opens)

## Activity Log

- 2026-02-11T22:17:53Z – system – lane=planned – Prompt created.
- 2026-02-11T23:54:52Z – claude-opus – shell_pid=5892 – lane=doing – Assigned agent via workflow command
- 2026-02-12T00:05:32Z – claude-opus – shell_pid=5892 – lane=for_review – Ready for review: Active standard card bottom sheet actions (Edit, Deactivate, Delete, Categorize) with confirmations and category picker
- 2026-02-12T00:05:44Z – claude-opus – shell_pid=30161 – lane=doing – Started review via workflow command
