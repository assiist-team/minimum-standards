---
work_package_id: WP08
title: Polish & Edge Cases
lane: "for_review"
dependencies:
- WP01
- WP02
- WP03
- WP04
base_branch: 001-standards-navigation-overhaul-WP08-merge-base
base_commit: 32e9b65e241904edf077f699b5b75239c5ece1d1
created_at: '2026-02-11T23:57:43.443287+00:00'
subtasks:
- T042
- T043
- T044
- T045
- T046
phase: Phase 4 - Cleanup
assignee: ''
agent: "claude-opus"
shell_pid: "11863"
review_status: ''
reviewed_by: ''
history:
- timestamp: '2026-02-11T22:17:53Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP08 – Polish & Edge Cases

## Objectives & Success Criteria

- Handle all edge cases defined in the spec.
- Implement empty state for zero standards.
- Clean up dead code from the navigation overhaul.

**Definition of Done**:
- [ ] Empty state displays when user has zero standards (active + inactive) with prompt to create via "+"
- [ ] Navigating away during Create Standard flow discards state; user starts fresh
- [ ] Day-of-week selectors reset when period changes from Weekly to other
- [ ] Activity without unit shows "Unit: (none)" on Step 2
- [ ] All dead code removed: StandardsLibraryScreen references, old nav stacks, StickyLogButton file, unused imports
- [ ] TypeScript compiles cleanly with no errors
- [ ] App runs without console warnings related to removed code

## Context & Constraints

- **Edge cases from spec**:
  1. Zero standards → empty state with CTA
  2. Toggle "Show Inactive" off while viewing logs → logs screen stays open, returning hides inactive
  3. Activity without unit → "Unit: (none)" on Step 2
  4. Navigate away mid-Create flow → discard state
  5. Day-of-week toggle + period switch → reset
- **Dead code candidates**:
  - `apps/mobile/src/screens/StandardsLibraryScreen.tsx` (replaced by unified screen)
  - `apps/mobile/src/components/StickyLogButton.tsx` (removed from nav)
  - `apps/mobile/src/navigation/DashboardStack.tsx` (merged/removed)
  - `apps/mobile/src/components/StandardsLibraryModal.tsx` (if no longer used)
  - `apps/mobile/src/hooks/useStandardsLibrary.ts` (if functionality merged into main hooks)
  - Unused imports in `screenWrappers.tsx`, `types.ts`, etc.
- **Implementation command**: `spec-kitty implement WP08 --base WP02`

## Subtasks & Detailed Guidance

### Subtask T042 – Empty State for Zero Standards

- **Purpose**: When the user has no standards at all (active or inactive), show a welcoming empty state with a prompt to create their first standard.

- **Steps**:
  1. In the Standards screen, detect when both active and inactive standard lists are empty:
     ```typescript
     const isEmpty = activeStandards.length === 0 && archivedStandards.length === 0;
     ```
  2. When empty, render an empty state view instead of the standard list:
     ```tsx
     {isEmpty && !loading && (
       <View style={styles.emptyState}>
         <MaterialIcons name="flag" size={64} color={theme.colors.secondary} />
         <Text style={styles.emptyTitle}>No Standards Yet</Text>
         <Text style={styles.emptyMessage}>
           Create your first Minimum Standard to start tracking your commitments.
         </Text>
         <TouchableOpacity style={styles.emptyButton} onPress={handleCreateStandard}>
           <MaterialIcons name="add" size={20} color={theme.colors.primaryContrastText} />
           <Text style={styles.emptyButtonText}>Create Your First Standard</Text>
         </TouchableOpacity>
       </View>
     )}
     ```
  3. The CTA button navigates to the Create Standard flow (same as "+" button)
  4. Center the empty state vertically on screen
  5. Don't show the empty state while loading — only after data has been fetched
  6. The kebab menu should still be available even in empty state (for toggling preferences)

- **Files**: `apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx` (modify, ~30 lines added)
- **Parallel?**: No — depends on WP03 (unified screen).

- **Validation**:
  - [ ] Empty state shows when user has zero standards
  - [ ] CTA button creates a new standard via the Create flow
  - [ ] Empty state disappears after first standard is created
  - [ ] Loading state shows while data is fetching (not the empty state)

### Subtask T043 – Handle Navigate-Away During Create Flow

- **Purpose**: When the user navigates away from the Create Standard flow mid-process, discard form state so they start fresh next time.

- **Steps**:
  1. In the `CreateStandardFlow` navigator component, add cleanup on unmount:
     ```typescript
     useEffect(() => {
       return () => {
         // Reset form state when flow is unmounted (user navigated away)
         useStandardsBuilderStore.getState().reset();
       };
     }, []);
     ```
  2. This handles:
     - User taps a different tab while on Step 2
     - User taps the close/X button on any step
     - User presses the hardware back button on Android beyond Step 1
  3. The close/X button should also call `reset()` before navigating back:
     ```typescript
     const handleClose = () => {
       useStandardsBuilderStore.getState().reset();
       navigation.goBack();
     };
     ```
  4. Consider adding a confirmation if the user has partially filled the form:
     - If any fields are set (activity selected, volume entered), show a discard confirmation
     - "Are you sure you want to discard this standard?" with Cancel/Discard buttons
     - If no fields are set, just close without confirmation
  5. Per the spec edge case: "Flow state is discarded; user starts fresh next time" — no need for draft saving

- **Files**:
  - `apps/mobile/src/navigation/CreateStandardFlow.tsx` (modify, ~15 lines added)
  - Step screens may need `beforeRemove` listener for mid-step navigation

- **Parallel?**: No — depends on WP04 (Create flow navigator exists).

- **Notes**: React Navigation's `beforeRemove` event can intercept navigation away and show a confirmation. See: https://reactnavigation.org/docs/preventing-going-back/

### Subtask T044 – Day-of-Week Toggle Reset on Period Change

- **Purpose**: When the user toggles day-of-week selection on (Weekly) and then switches period to Daily, the selectors should hide and the toggle should reset.

- **Steps**:
  1. In `SetPeriodStep.tsx`, add a `useEffect` watching the selected period:
     ```typescript
     useEffect(() => {
       if (cadence.unit !== 'week') {
         setDayOfWeekEnabled(false);
         setSelectedDays([]);
       }
     }, [cadence.unit]);
     ```
  2. This ensures:
     - Switching from Weekly to Daily → day selectors hide, toggle resets
     - Switching from Weekly to Monthly → same behavior
     - Switching from Weekly to Custom → same behavior
     - Switching from Daily to Weekly → toggle is off by default (user must manually enable)
  3. Clear the selected days in the builder store as well (if stored there)

- **Files**: `apps/mobile/src/screens/create-standard/SetPeriodStep.tsx` (modify, ~10 lines added)
- **Parallel?**: No — depends on WP05 (Step 3 exists).

- **Validation**:
  - [ ] Select Weekly → enable day toggle → select some days → switch to Daily → toggle is off, days cleared
  - [ ] Switch back to Weekly → toggle is off, no days pre-selected
  - [ ] Day-of-week section is completely hidden for non-Weekly periods

### Subtask T045 – Activity Without Unit Handling

- **Purpose**: Handle the edge case where an activity has no unit defined.

- **Steps**:
  1. In `SelectActivityStep.tsx` (Step 1), when displaying unit:
     ```typescript
     const unitDisplay = selectedActivity?.unit || '(none)';
     ```
     Renders as: "Unit: (none)"
  2. In `SetVolumeStep.tsx` (Step 2), the read-only unit display:
     ```typescript
     const effectiveUnit = store.getEffectiveUnit();
     const unitLabel = effectiveUnit || '(none)';
     ```
     Renders as: "Unit: (none)"
  3. The volume input should still work normally — user enters a plain number
  4. The placeholder text might say "Enter target volume" without a unit suffix

- **Files**:
  - `apps/mobile/src/screens/create-standard/SelectActivityStep.tsx` (modify, ~5 lines)
  - `apps/mobile/src/screens/create-standard/SetVolumeStep.tsx` (modify, ~5 lines)

- **Parallel?**: Yes — simple text change, independent of other subtasks.

### Subtask T046 – Clean Up Dead Code

- **Purpose**: Remove files and imports that are no longer used after the navigation overhaul.

- **Steps**:
  1. Identify dead code by running TypeScript compiler:
     ```bash
     npx tsc --noEmit 2>&1 | head -50
     ```
  2. Delete files that are fully replaced and no longer imported:
     - `apps/mobile/src/screens/StandardsLibraryScreen.tsx` — replaced by unified Standards screen
     - `apps/mobile/src/components/StickyLogButton.tsx` — removed from navigation
     - `apps/mobile/src/navigation/DashboardStack.tsx` — if merged/removed
     - `apps/mobile/src/screens/ArchivedStandardsScreen.tsx` — if inactive standards are now inline
  3. Clean up imports in remaining files:
     - `apps/mobile/src/navigation/screenWrappers.tsx` — remove wrappers for deleted screens
     - `apps/mobile/src/navigation/types.ts` — remove unused param list types
     - Any file importing deleted components
  4. Check for orphaned hooks:
     - `apps/mobile/src/hooks/useStandardsLibrary.ts` — check if still needed (might be used by unified screen)
  5. Verify no broken imports remain:
     ```bash
     npx tsc --noEmit
     ```
  6. Verify the app starts without errors
  7. **DO NOT delete** files that are still imported somewhere — use TypeScript compiler errors as the source of truth

- **Files**: Multiple files deleted/modified (see list above)
- **Parallel?**: Yes — independent cleanup task.

- **Validation**:
  - [ ] `npx tsc --noEmit` passes with no errors
  - [ ] App launches successfully
  - [ ] No console warnings about missing modules
  - [ ] No orphaned files remain from the old navigation structure

## Risks & Mitigations

- **Premature deletion**: Don't delete a file that's still imported somewhere. Always verify with `npx tsc --noEmit` before and after deletions.
- **useStandardsLibrary hook**: This hook may still be used by the unified Standards screen for fetching archived standards. Check usage before deleting.
- **Discard confirmation UX**: Adding a "discard changes?" dialog when navigating away adds complexity. Per the spec, simply discarding is acceptable — only add the confirmation if time permits and it doesn't complicate the code.

## Review Guidance

- Test each edge case individually:
  1. New user with zero standards → verify empty state
  2. Mid-flow navigation away → verify state resets
  3. Day-of-week toggle with period switching → verify reset behavior
  4. Create standard with unit-less activity → verify "(none)" display
- Run TypeScript compiler to verify no type errors
- Verify no dead code references remain
- Check the app runs cleanly on both iOS and Android

## Activity Log

- 2026-02-11T22:17:53Z – system – lane=planned – Prompt created.
- 2026-02-11T23:57:43Z – claude-opus – shell_pid=11863 – lane=doing – Assigned agent via workflow command
- 2026-02-12T00:03:19Z – claude-opus – shell_pid=11863 – lane=for_review – Ready for review: Empty state for zero standards, Create flow cleanup on navigate-away, dead code removal (DashboardStack, StickyLogButton, ArchivedStandardsScreen). T044 blocked — SetPeriodStep is placeholder (WP05 not in merge base). T045 already handled in SelectActivityStep.
