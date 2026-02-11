---
work_package_id: WP04
title: Create Standard Flow — Step 1
lane: "doing"
dependencies: [WP02]
base_branch: 001-standards-navigation-overhaul-WP02
base_commit: 712676f785ff3a69f8c1671f8a8c65308541e153
created_at: '2026-02-11T23:23:46.624759+00:00'
subtasks:
- T018
- T019
- T020
- T021
- T022
phase: Phase 1 - Core Features
assignee: ''
agent: ''
shell_pid: "37872"
review_status: ''
reviewed_by: ''
history:
- timestamp: '2026-02-11T22:17:53Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP04 – Create Standard Flow — Step 1

## Objectives & Success Criteria

- Build a new survey-style Create Standard flow with one step per screen and forward/back navigation.
- Create the flow navigator with a progress indicator (step 1/2/3).
- Build Step 1: Select or Create Activity with inline unit/category display, category assignment, and methodology tips.

**Definition of Done**:
- [ ] Tapping "+" in bottom nav opens the Create Standard flow full-screen
- [ ] Step 1 shows a list of existing activities with search + "Create New Activity" option
- [ ] Selecting an activity shows its unit and category below the selection
- [ ] Activities without a category show "Category: None"
- [ ] Users can assign/change category on the selected activity
- [ ] Inline tip text displays on screen
- [ ] "Learn More" reveals a fuller methodology explanation
- [ ] Progress indicator shows "Step 1 of 3"
- [ ] Back button returns to previous screen; Next button advances to Step 2

## Context & Constraints

- **Existing builder**: `apps/mobile/src/screens/StandardsBuilderScreen.tsx` (48KB) — single-screen form with modals. The new flow replaces this with 3 separate screens.
- **Builder store**: `apps/mobile/src/stores/standardsBuilderStore.ts` — holds form state (`selectedActivity`, `cadence`, `goalTotal`, etc.). Reuse this across steps.
- **Activities hook**: `apps/mobile/src/hooks/useActivities.ts` — provides `activities`, `createActivity()`, search functionality
- **Categories hook**: `apps/mobile/src/hooks/useCategories.ts` — provides `categories`, `updateActivity()` for category assignment
- **Activity modal**: `apps/mobile/src/components/ActivityModal.tsx` — existing modal for creating/editing activities
- **Shared model**: `@minimum-standards/shared-model` — `Activity` type with `name`, `unit`, `categoryId`
- **Spec requirements**: FR-017 through FR-020, FR-026, FR-027, FR-028
- **Tip text (Step 1)**: *"Pick the activity that, if you did enough of it, would make success almost guaranteed."*
- **Implementation command**: `spec-kitty implement WP04 --base WP02`

## Subtasks & Detailed Guidance

### Subtask T018 – Create CreateStandardFlow Navigator

- **Purpose**: Provide the multi-step navigation container with progress indicator and consistent forward/back controls.

- **Steps**:
  1. Create `apps/mobile/src/navigation/CreateStandardFlow.tsx`
  2. Use a `createNativeStackNavigator` with 3 screens:
     ```typescript
     export type CreateStandardFlowParamList = {
       SelectActivity: undefined;
       SetVolume: undefined;
       SetPeriod: undefined;
     };
     ```
  3. Configure the navigator:
     - `screenOptions`: hide default header (we'll use a custom one)
     - Each screen renders with a custom header containing: back arrow, step title, progress indicator
  4. Create a reusable `StepHeader` component:
     ```tsx
     function StepHeader({ step, totalSteps, title, onBack, onClose }: StepHeaderProps) {
       return (
         <View style={styles.header}>
           <TouchableOpacity onPress={onBack}>
             <MaterialIcons name="arrow-back" size={24} />
           </TouchableOpacity>
           <Text style={styles.title}>{title}</Text>
           <TouchableOpacity onPress={onClose}>
             <MaterialIcons name="close" size={24} />
           </TouchableOpacity>
         </View>
         <StepIndicator current={step} total={totalSteps} />
       );
     }
     ```
  5. Create a `StepIndicator` component — simple dots or a numbered progress bar:
     ```tsx
     function StepIndicator({ current, total }: { current: number; total: number }) {
       return (
         <View style={styles.indicatorRow}>
           {Array.from({ length: total }).map((_, i) => (
             <View key={i} style={[
               styles.dot,
               i < current ? styles.dotCompleted : i === current ? styles.dotActive : styles.dotInactive
             ]} />
           ))}
         </View>
       );
     }
     ```
  6. Each step screen has a "Next" button at the bottom (disabled until required fields are filled)
  7. Step 1 has no back arrow (first step) — instead shows close/X button
  8. Register this navigator in the appropriate stack (StandardsStack or as a modal presentation)

- **Files**:
  - `apps/mobile/src/navigation/CreateStandardFlow.tsx` (new, ~80 lines)
  - `apps/mobile/src/navigation/types.ts` (add `CreateStandardFlowParamList`)
  - `apps/mobile/src/navigation/StandardsStack.tsx` (register CreateStandardFlow)

- **Parallel?**: No — other subtasks depend on this navigator.

- **Notes**: Consider presenting the flow as a modal stack (full-screen modal) so it overlays on top of any tab. Use `presentation: 'modal'` or `fullScreenModal` in the stack options.

### Subtask T019 – Build Step 1 Screen (Select or Create Activity)

- **Purpose**: Allow the user to select an existing activity or create a new one. This is the entry point of the Create Standard flow.

- **Steps**:
  1. Create `apps/mobile/src/screens/create-standard/SelectActivityStep.tsx`
  2. Structure:
     - Search input at top (TextInput with search icon)
     - FlatList of activities filtered by search query
     - Each activity row: activity name + radio/check indicator for selection
     - "Create New Activity" row at the bottom (or top) with a "+" icon
  3. Use `useActivities()` hook to get the activity list:
     ```typescript
     const { activities, createActivity } = useActivities();
     ```
  4. Use `standardsBuilderStore` to store the selected activity:
     ```typescript
     const { selectedActivity, setSelectedActivity } = useStandardsBuilderStore();
     // Note: Check actual store API — may need to adapt
     ```
  5. When user taps "Create New Activity", open the existing `ActivityModal` component for inline creation
  6. After creating a new activity, auto-select it
  7. "Next" button at bottom is enabled only when an activity is selected
  8. Tapping "Next" navigates to `SetVolume` step

- **Files**: `apps/mobile/src/screens/create-standard/SelectActivityStep.tsx` (new, ~150 lines)
- **Parallel?**: No — core Step 1 screen that T020–T022 build upon.

- **Notes**: The existing `StandardsBuilderScreen` uses a `StandardsLibraryModal` for activity selection. The new flow replaces this with an inline list, not a modal.

### Subtask T020 – Display Unit and Category Below Selected Activity

- **Purpose**: When an activity is selected, show its unit and category inline per FR-019.

- **Steps**:
  1. Below the selected activity (or in a "selected activity" section), display:
     ```
     Unit: minutes
     Category: Fitness
     ```
     Or if no category:
     ```
     Unit: minutes
     Category: None
     ```
  2. Use the `useCategories()` hook to resolve `categoryId` to category name:
     ```typescript
     const { categories } = useCategories();
     const categoryName = selectedActivity?.categoryId
       ? categories.find(c => c.id === selectedActivity.categoryId)?.name ?? 'None'
       : 'None';
     ```
  3. Display as two lines of text below the selected activity row with secondary text color
  4. If the activity has no unit, show "Unit: (none)"
  5. Style: secondary text color, 13px font size, 4px gap between lines

- **Files**: `apps/mobile/src/screens/create-standard/SelectActivityStep.tsx` (modify, ~20 lines added)
- **Parallel?**: No — depends on T019.

- **Validation**:
  - [ ] Selected activity shows unit and category
  - [ ] No category → shows "Category: None"
  - [ ] No unit → shows "Unit: (none)"

### Subtask T021 – Category Assignment/Change on Step 1

- **Purpose**: Allow users to assign or change the selected activity's category per FR-020.

- **Steps**:
  1. Make the "Category: ..." line tappable
  2. Tapping opens a category picker — either:
     - A `BottomSheetMenu` listing all categories + "None" option
     - Or an inline picker/selector
  3. When a category is selected, update the activity via `useActivities().updateActivity()`:
     ```typescript
     await updateActivity(selectedActivity.id, { categoryId: newCategoryId });
     ```
  4. The display updates immediately after category change
  5. Include a small edit icon next to the category text to indicate it's tappable

- **Files**: `apps/mobile/src/screens/create-standard/SelectActivityStep.tsx` (modify, ~30 lines added)
- **Parallel?**: No — depends on T020 (category display).

- **Notes**: Category changes here update the Activity globally (not just for this standard). This is the intended behavior per the spec.

### Subtask T022 – Inline Tip and Learn More

- **Purpose**: Display methodology guidance to help users choose the right activity per FR-026 and FR-027.

- **Steps**:
  1. Add an inline tip section to Step 1, positioned between the search bar and the activity list (or below the selected activity area):
     ```tsx
     <View style={styles.tipContainer}>
       <MaterialIcons name="lightbulb-outline" size={16} color={theme.colors.secondary} />
       <Text style={styles.tipText}>
         Pick the activity that, if you did enough of it, would make success almost guaranteed.
       </Text>
     </View>
     ```
  2. Below the tip, add a "Learn More" link:
     ```tsx
     <TouchableOpacity onPress={() => setLearnMoreExpanded(!learnMoreExpanded)}>
       <Text style={styles.learnMore}>Learn More</Text>
     </TouchableOpacity>
     ```
  3. When "Learn More" is tapped, expand an inline section with a fuller explanation:
     ```
     A Minimum Standard is the smallest amount of an activity you can commit to doing consistently.
     The key insight: choose the activity that is most directly connected to your goal. If your goal
     is to get fit, what single activity, done consistently, would make that almost inevitable?
     Focus on the "lead domino" — the one action that makes everything else easier or unnecessary.
     ```
  4. The expansion can be animated (Animated height) or simply conditional rendering
  5. Style the tip with a light background tint, rounded corners, and subtle left border

- **Files**: `apps/mobile/src/screens/create-standard/SelectActivityStep.tsx` (modify, ~40 lines added)
- **Parallel?**: Yes — can be built independently of the activity list logic.

- **Validation**:
  - [ ] Tip text is visible on Step 1
  - [ ] "Learn More" is tappable
  - [ ] Tapping expands a fuller explanation
  - [ ] Tapping again collapses it

## Risks & Mitigations

- **standardsBuilderStore coupling**: The store is currently tightly coupled to `StandardsBuilderScreen`. It stores `selectedActivity` as part of its state but may use different setter patterns. Read the store implementation carefully and adapt as needed.
- **Activity creation inline**: Using `ActivityModal` from within the flow should work, but verify it doesn't conflict with the flow's modal presentation (modal-on-modal).
- **Category update side effect**: Changing an activity's category in Step 1 affects the activity globally. This is intentional per the spec but worth noting.

## Review Guidance

- Verify the flow opens full-screen from the "+" button
- Check progress indicator shows correct step (1 of 3)
- Test activity search and selection
- Verify unit/category display for activities with and without categories
- Test inline activity creation (tap "Create New Activity", fill form, verify auto-selection)
- Test category assignment/change via tapping the category line
- Verify tip text and Learn More expansion/collapse
- Verify "Next" button is disabled until an activity is selected
- Verify close/X button exits the flow entirely

## Activity Log

- 2026-02-11T22:17:53Z – system – lane=planned – Prompt created.
