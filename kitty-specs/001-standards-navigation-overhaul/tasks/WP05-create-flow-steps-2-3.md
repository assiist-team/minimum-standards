---
work_package_id: WP05
title: Create Standard Flow — Steps 2 & 3
lane: "doing"
dependencies: [WP04]
base_branch: 001-standards-navigation-overhaul-WP04
base_commit: 358ed179cd153e3ca5a83f56dfc72d34adfcedb8
created_at: '2026-02-11T23:40:34.412310+00:00'
subtasks:
- T023
- T024
- T025
- T026
- T027
- T028
- T029
- T030
phase: Phase 2 - Create Flow
assignee: ''
agent: "claude-opus"
shell_pid: "73982"
review_status: ''
reviewed_by: ''
history:
- timestamp: '2026-02-11T22:17:53Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP05 – Create Standard Flow — Steps 2 & 3

## Objectives & Success Criteria

- Build Step 2 (Set Volume) with inherited unit display, session breakdown toggle, and methodology tips.
- Build Step 3 (Set Period) with period selector, day-of-week toggle, normalized styling, and methodology tips.
- Wire the final submission to create a standard and navigate back.

**Definition of Done**:
- [ ] Step 2 shows volume input with inherited read-only unit from selected activity
- [ ] "Break Volume into Sessions" toggle reveals session configuration fields
- [ ] Step 2 inline tip and Learn More display correctly
- [ ] Step 3 offers Daily, Weekly, Monthly, Custom period options
- [ ] Day-of-week selectors (Mo–Su) hidden by default, revealed via toggle
- [ ] Day-of-week toggle resets when switching from Weekly to non-Weekly period
- [ ] Step 3 inline tip and Learn More display correctly
- [ ] Border radius on Step 3 elements matches design system
- [ ] Completing all 3 steps creates a new standard visible on Standards screen
- [ ] Progress indicator updates correctly (2/3, 3/3)

## Context & Constraints

- **Builder store**: `apps/mobile/src/stores/standardsBuilderStore.ts` — holds form state:
  - `goalTotal`: target volume number
  - `breakdownEnabled`: boolean for session breakdown
  - `sessionsPerCadence`: number of sessions per period
  - `volumePerSession`: volume per session
  - `getEffectiveUnit()`: returns the unit (from activity or override)
  - `generatePayload()`: produces the `Standard` creation payload
- **Cadence utils**: `apps/mobile/src/utils/cadenceUtils.ts` — `CADENCE_PRESETS`, `CadencePreset`, `validateCadence()`, `isPresetCadence()`
- **Standards hook**: `apps/mobile/src/hooks/useStandards.ts` — `createStandard()` for final submission
- **Weekday options**: Already defined in `StandardsBuilderScreen.tsx`:
  ```typescript
  const WEEKDAY_OPTIONS = [
    { label: 'Mo', value: 1, full: 'Monday' },
    { label: 'Tu', value: 2, full: 'Tuesday' },
    // ... through Sunday
  ];
  ```
- **Design system**: `BUTTON_BORDER_RADIUS` from `@nine4/ui-kit` for consistent border radius
- **Spec requirements**: FR-021 through FR-028
- **Tip text (Step 2)**: *"Start where you can consistently win, not at your ideal level."*
- **Tip text (Step 3)**: *"Focus on total volume per period — flexibility beats rigid daily targets."*
- **Implementation command**: `spec-kitty implement WP05 --base WP04`

## Subtasks & Detailed Guidance

### Subtask T023 – Build Step 2 Screen (Set Volume)

- **Purpose**: Allow the user to set their target volume for the standard. The unit is inherited from the selected activity and displayed as read-only context.

- **Steps**:
  1. Create `apps/mobile/src/screens/create-standard/SetVolumeStep.tsx`
  2. Structure:
     - Header with step indicator (2 of 3) via `StepHeader` from WP04
     - Unit display: read-only label showing the inherited unit (e.g., "minutes", "reps")
       ```tsx
       <Text style={styles.unitLabel}>Unit: {effectiveUnit}</Text>
       ```
     - Volume input: numeric TextInput for total volume
       ```tsx
       <TextInput
         value={goalTotal}
         onChangeText={setGoalTotal}
         keyboardType="numeric"
         placeholder="Enter target volume"
       />
       ```
     - "Next" button at bottom (enabled when volume > 0)
  3. Read state from `standardsBuilderStore`:
     ```typescript
     const { goalTotal, setGoalTotal, getEffectiveUnit } = useStandardsBuilderStore();
     const effectiveUnit = getEffectiveUnit();
     ```
  4. The unit field is NOT editable per FR-021 — it's context from Step 1
  5. "Back" navigates to Step 1, "Next" navigates to Step 3

- **Files**: `apps/mobile/src/screens/create-standard/SetVolumeStep.tsx` (new, ~120 lines)
- **Parallel?**: No — core Step 2 screen.

- **Notes**: Check `standardsBuilderStore` for the exact getter/setter names — they may differ from the names used here.

### Subtask T024 – "Break Volume into Sessions" Toggle

- **Purpose**: Allow users to split their total volume into sessions per FR-022.

- **Steps**:
  1. Add a toggle row below the volume input:
     ```tsx
     <View style={styles.toggleRow}>
       <Text>Break Volume into Sessions</Text>
       <Switch value={breakdownEnabled} onValueChange={setBreakdownEnabled} />
     </View>
     ```
  2. When enabled, show two additional fields:
     - "Sessions per period": numeric input (how many sessions per cadence)
     - "Volume per session": auto-calculated or manually editable
  3. Connect to `standardsBuilderStore`:
     ```typescript
     const { breakdownEnabled, setBreakdownEnabled, sessionsPerCadence, setSessionsPerCadence, volumePerSession } = useStandardsBuilderStore();
     ```
  4. The store auto-recalculates `goalTotal = sessionsPerCadence × volumePerSession` — verify this behavior
  5. Label must be exactly "Break Volume into Sessions" (not "Break this volume into session") per FR-022

- **Files**: `apps/mobile/src/screens/create-standard/SetVolumeStep.tsx` (modify, ~40 lines added)
- **Parallel?**: No — part of Step 2 screen.

- **Validation**:
  - [ ] Toggle labeled exactly "Break Volume into Sessions"
  - [ ] When enabled, session fields appear
  - [ ] Volume auto-calculates from sessions × per-session

### Subtask T025 – Inline Tip and Learn More for Step 2

- **Purpose**: Display methodology guidance for volume setting per FR-026 and FR-027.

- **Steps**:
  1. Add tip section to Step 2 (same pattern as T022):
     ```tsx
     <View style={styles.tipContainer}>
       <MaterialIcons name="lightbulb-outline" size={16} />
       <Text style={styles.tipText}>
         Start where you can consistently win, not at your ideal level.
       </Text>
     </View>
     ```
  2. Add "Learn More" expandable with fuller explanation:
     ```
     Your Minimum Standard should be low enough that you can hit it even on your worst day.
     The goal isn't to set your ideal volume — it's to set the floor that you never go below.
     Once you build consistency at this level, you can always increase it later.
     Think of it as your "never go below this" commitment, not your aspiration.
     ```
  3. Position below the volume/sessions input area
  4. Use the same tip component pattern established in Step 1 (T022)

- **Files**: `apps/mobile/src/screens/create-standard/SetVolumeStep.tsx` (modify, ~30 lines added)
- **Parallel?**: No — part of Step 2 screen.

### Subtask T026 – Build Step 3 Screen (Set Period)

- **Purpose**: Allow the user to choose the period/cadence for their standard.

- **Steps**:
  1. Create `apps/mobile/src/screens/create-standard/SetPeriodStep.tsx`
  2. Structure:
     - Header with step indicator (3 of 3)
     - Period selector: radio button group or pill selector with options:
       - Daily
       - Weekly
       - Monthly
       - Custom
     - For "Custom", show interval + unit selector (e.g., "Every 2 weeks")
     - "Create Standard" button at bottom (replaces "Next" since this is the last step)
  3. Connect to `standardsBuilderStore` cadence state:
     ```typescript
     const { cadence, setCadence } = useStandardsBuilderStore();
     ```
  4. Use `CADENCE_PRESETS` from `cadenceUtils.ts` to map UI selections to cadence objects:
     ```typescript
     import { CADENCE_PRESETS, getCadencePreset } from '../utils/cadenceUtils';
     ```
  5. Period selection UI: use large tappable cards or segmented control
  6. Each option clearly labeled in Title Case

- **Files**: `apps/mobile/src/screens/create-standard/SetPeriodStep.tsx` (new, ~150 lines)
- **Parallel?**: No — core Step 3 screen.

### Subtask T027 – Day-of-Week Selectors with Toggle

- **Purpose**: Allow users to optionally specify which days of the week apply, hidden by default per FR-024.

- **Steps**:
  1. Add a toggle below the period selector: "Select Specific Days"
  2. Toggle is hidden for Daily/Monthly/Custom — only shown for Weekly period
  3. When Weekly is selected AND toggle is enabled, show day-of-week buttons:
     ```tsx
     <View style={styles.weekdayRow}>
       {WEEKDAY_OPTIONS.map(day => (
         <TouchableOpacity
           key={day.value}
           style={[styles.dayButton, selectedDays.includes(day.value) && styles.dayButtonActive]}
           onPress={() => toggleDay(day.value)}
         >
           <Text>{day.label}</Text>
         </TouchableOpacity>
       ))}
     </View>
     ```
  4. Extract `WEEKDAY_OPTIONS` from `StandardsBuilderScreen.tsx` into a shared constant (or duplicate in this file)
  5. **Edge case**: When user switches period from Weekly to Daily/Monthly/Custom:
     - Hide the day-of-week selectors
     - Reset the toggle to off
     - Clear selected days
  6. Store selected weekdays in `standardsBuilderStore` (check if `periodStartPreference` handles this)

- **Files**: `apps/mobile/src/screens/create-standard/SetPeriodStep.tsx` (modify, ~50 lines added)
- **Parallel?**: No — part of Step 3 screen.

- **Validation**:
  - [ ] Day-of-week selectors hidden by default
  - [ ] Only visible when Weekly is selected AND toggle is on
  - [ ] Switching from Weekly to Daily hides selectors and resets toggle
  - [ ] Selected days are stored correctly

### Subtask T028 – Normalize Border Radius

- **Purpose**: Ensure all interactive elements on Step 3 use consistent border radius per FR-025.

- **Steps**:
  1. Import `BUTTON_BORDER_RADIUS` from `@nine4/ui-kit`
  2. Apply to all interactive elements on Step 3:
     - Period selector buttons/cards
     - Day-of-week buttons
     - "Create Standard" button
     - Custom interval inputs
  3. Check that the value matches other screens in the app for visual consistency

- **Files**: `apps/mobile/src/screens/create-standard/SetPeriodStep.tsx` (modify, ~10 lines)
- **Parallel?**: Yes — independent styling task.

### Subtask T029 – Inline Tip and Learn More for Step 3

- **Purpose**: Display methodology guidance for period selection per FR-026 and FR-027.

- **Steps**:
  1. Add tip section to Step 3 (same pattern as T022 and T025):
     ```tsx
     <View style={styles.tipContainer}>
       <MaterialIcons name="lightbulb-outline" size={16} />
       <Text style={styles.tipText}>
         Focus on total volume per period — flexibility beats rigid daily targets.
       </Text>
     </View>
     ```
  2. Add "Learn More" expandable:
     ```
     The Minimum Standards methodology focuses on total volume over a period rather than
     rigid daily requirements. A weekly target of "run 3 times" is more sustainable than
     "run every Monday, Wednesday, Friday" because life is unpredictable.
     Choose the longest period you're comfortable with — weekly is usually the sweet spot
     for most people. It gives enough flexibility for bad days while maintaining accountability.
     ```
  3. Position below the period selector and day-of-week area

- **Files**: `apps/mobile/src/screens/create-standard/SetPeriodStep.tsx` (modify, ~30 lines added)
- **Parallel?**: No — part of Step 3 screen.

### Subtask T030 – Wire Final Submission

- **Purpose**: Complete the flow by creating the standard and returning to the Standards screen.

- **Steps**:
  1. The "Create Standard" button on Step 3 triggers submission:
     ```typescript
     const { createStandard } = useStandards();
     const store = useStandardsBuilderStore();

     const handleSubmit = async () => {
       try {
         const payload = store.generatePayload();
         await createStandard(payload);
         store.reset(); // Clear form state
         navigation.getParent()?.goBack(); // Exit the flow
       } catch (error) {
         // Show error to user
       }
     };
     ```
  2. `generatePayload()` from the builder store creates the full standard creation payload
  3. After successful creation:
     - Reset the builder store (`store.reset()`)
     - Navigate back to the Standards screen (exit the entire Create flow)
     - The new standard should appear in the active standards list automatically (Firestore subscription)
  4. Show a loading indicator while creating
  5. Handle errors — show an error message without losing form state (don't reset on error)
  6. Track the event via `trackStandardEvent()` from `apps/mobile/src/utils/analytics.ts`

- **Files**: `apps/mobile/src/screens/create-standard/SetPeriodStep.tsx` (modify, ~30 lines added)
- **Parallel?**: No — depends on all prior Step 3 work.

- **Validation**:
  - [ ] Tapping "Create Standard" creates a new standard in Firestore
  - [ ] Flow navigates back to Standards screen after creation
  - [ ] New standard appears in the active list
  - [ ] Builder store is reset after successful creation
  - [ ] Errors are shown without losing form data
  - [ ] Loading state shown during creation

## Risks & Mitigations

- **standardsBuilderStore API**: The store's `generatePayload()` method expects all fields to be set. Verify that Step 1 (activity), Step 2 (volume), and Step 3 (cadence) collectively set all required fields.
- **Navigation exit**: Exiting a nested navigator from Step 3 back to the tab screen requires `navigation.getParent()?.goBack()` or `navigation.reset()`. Test that this works correctly from the third level of nesting.
- **Form state persistence across steps**: `standardsBuilderStore` is a Zustand store, so state persists across screen transitions within the flow. Verify this works with React Navigation's screen lifecycle.
- **Day-of-week reset**: The edge case where switching periods resets day selection must be tested thoroughly — use `useEffect` watching the cadence unit.

## Review Guidance

- Walk through the entire 3-step flow: select activity → set volume → set period → create
- Verify unit is read-only on Step 2 and correctly inherited from Step 1
- Test session breakdown: enable toggle, set sessions, verify auto-calculation
- Test all 4 period options (Daily, Weekly, Monthly, Custom)
- Test day-of-week: enable on Weekly, select days, switch to Daily → verify reset
- Test Learn More on both Step 2 and Step 3
- Test error handling: disable network, attempt creation, verify error message
- Test back navigation through all steps
- Verify the created standard matches the inputs (correct activity, volume, period)

## Activity Log

- 2026-02-11T22:17:53Z – system – lane=planned – Prompt created.
- 2026-02-11T23:40:34Z – claude-opus – shell_pid=73982 – lane=doing – Assigned agent via workflow command
