---
work_package_id: WP02
title: Edit Button + Remove Inline Category Picker
lane: "doing"
dependencies: [WP01]
base_branch: 002-activity-category-edit-in-create-flow-WP01
base_commit: baca165e2b2c3b470b9c98f91a249b328198ab04
created_at: '2026-02-12T02:12:06.696702+00:00'
subtasks:
- T006
- T007
- T008
- T009
- T010
- T011
phase: Phase 1 - SelectActivityStep Rework
assignee: ''
agent: "claude-opus"
shell_pid: "86643"
review_status: ''
reviewed_by: ''
history:
- timestamp: '2026-02-12T01:43:15Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP02 – Edit Button + Remove Inline Category Picker

## ⚠️ IMPORTANT: Review Feedback Status

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_status` field above. If it says `has_feedback`, scroll to the **Review Feedback** section immediately (right below this notice).
- **You must address all feedback** before your work is complete. Feedback items are your implementation TODO list.
- **Mark as acknowledged**: When you understand the feedback and begin addressing it, update `review_status: acknowledged` in the frontmatter.
- **Report progress**: As you address each feedback item, update the Activity Log explaining what you changed.

---

## Review Feedback

> **Populated by `/spec-kitty.review`** – Reviewers add detailed feedback here when work needs changes. Implementation must address every item listed below before returning for re-review.

*[This section is empty initially. Reviewers will populate it if the work is returned from review. If you see feedback here, treat each item as a must-do before completion.]*

---

## Markdown Formatting
Wrap HTML/XML tags in backticks: `` `<div>` ``, `` `<script>` ``
Use language identifiers in code blocks: ````python`, ````bash`

---

## Implementation Command

```bash
spec-kitty implement WP02 --base WP01
```

This WP depends on WP01. The `--base WP01` flag ensures the worktree branches from WP01's completed work.

---

## Objectives & Success Criteria

Replace the broken inline category picker overlay on `SelectActivityStep` with an Edit button that opens `ActivityModal` in full edit mode. Remove all dead category picker code. This addresses User Stories 3 & 4 and FR-007 through FR-013.

**Success criteria:**
- Edit button visible when an activity is selected (FR-007)
- Edit button hidden when no activity is selected (FR-008)
- Edit button opens ActivityModal in edit mode with current data pre-populated (FR-009)
- After saving, updated details reflected on SelectActivityStep immediately (FR-010)
- No category picker overlay/bottom sheet on SelectActivityStep (FR-011)
- Category displayed as read-only text (FR-012)
- All category-picker-related dead code removed (FR-013)

## Context & Constraints

- **File to modify**: `apps/mobile/src/screens/create-standard/SelectActivityStep.tsx` (~512 lines currently)
- **Spec**: `kitty-specs/002-activity-category-edit-in-create-flow/spec.md`
- **Plan**: `kitty-specs/002-activity-category-edit-in-create-flow/plan.md` — Change 2
- **Depends on WP01**: ActivityModal now has a Category field. The Edit button opens this enhanced modal.
- **Key existing code**:
  - The file already imports `ActivityModal`, `useCategories`, `useActivities` (including `updateActivity`)
  - The file already has a "Create New Activity" `<ActivityModal>` instance (line 347-352)
  - The `getCategoryName` helper (lines 91-95) is reused for read-only display — keep it
  - The `standardsBuilderStore` manages `selectedActivity` and `setSelectedActivity`
- **Data flow**: After editing via ActivityModal, `useActivities()` Firestore snapshot listener auto-refreshes the activity list. We also call `setSelectedActivity()` with updated data so the selection details panel updates immediately.

## Subtasks & Detailed Guidance

### Subtask T006 – Remove inline category picker state, handler, and overlay JSX

- **Purpose**: Delete the broken inline category picker (FR-011, FR-013). This is the largest single change — removes ~70 lines.
- **Steps**:
  1. **Remove state** (line 40):
     ```typescript
     // DELETE this line:
     const [showCategoryPicker, setShowCategoryPicker] = useState(false);
     ```
  2. **Remove handler** (lines 80-89):
     ```typescript
     // DELETE this entire callback:
     const handleCategoryChange = useCallback(
       async (categoryId: string | null) => {
         if (!selectedActivity) return;
         await updateActivity(selectedActivity.id, { categoryId });
         setSelectedActivity({ ...selectedActivity, categoryId });
         setShowCategoryPicker(false);
       },
       [selectedActivity, updateActivity, setSelectedActivity],
     );
     ```
  3. **Remove overlay JSX** (lines 246-306):
     Delete the entire `{/* T021: Category Picker Overlay */}` block — from the comment on line 246 through the closing `)}` on line 306.
  4. **Clean up imports**: After removal, check if `updateActivity` is still needed from `useActivities`. It will be needed again in T009 (for the edit save handler), so keep it. But verify no other dead references remain.
- **Files**: `apps/mobile/src/screens/create-standard/SelectActivityStep.tsx`
- **Notes**: The `updateActivity` destructured from `useActivities()` on line 32 is currently used only by `handleCategoryChange`. After T006 removes that handler, `updateActivity` would be unused — but T009 re-introduces a usage. If implementing T006 and T009 together, no issue. If implementing sequentially, leave `updateActivity` in the destructure temporarily.

### Subtask T007 – Remove category picker styles from StyleSheet

- **Purpose**: Clean up dead CSS that supported the removed overlay (FR-013).
- **Steps**:
  1. Remove the following style entries from the `StyleSheet.create` block (lines 464-496):
     - `categoryPickerOverlay` (lines 465-468)
     - `categoryPickerContent` (lines 469-473)
     - `categoryPickerHeader` (lines 474-481)
     - `categoryPickerTitle` (lines 482-485)
     - `categoryOption` (lines 486-493)
     - `categoryOptionText` (lines 494-496)
  2. Also remove the comment `// Category picker styles (T021)` on line 464.
- **Files**: `apps/mobile/src/screens/create-standard/SelectActivityStep.tsx` (styles section, lines 464-496)
- **Notes**: This is straightforward deletion. ~33 lines removed.

### Subtask T008 – Convert category display from tappable to read-only

- **Purpose**: The category row in the selected activity details should show the category but NOT open a picker (FR-012). The edit icon and `onPress` must be removed.
- **Steps**:
  1. Locate the category `TouchableOpacity` in the selection details panel (lines 234-242):
     ```tsx
     <TouchableOpacity
       style={styles.detailRow}
       onPress={() => setShowCategoryPicker(true)}
     >
       <Text style={[styles.detailText, { color: theme.text.secondary }]}>
         Category: {getCategoryName(selectedActivity.categoryId)}
       </Text>
       <MaterialIcons name="edit" size={14} color={theme.text.secondary} />
     </TouchableOpacity>
     ```
  2. Replace with a plain `View`:
     ```tsx
     <View style={styles.detailRow}>
       <Text style={[styles.detailText, { color: theme.text.secondary }]}>
         Category: {getCategoryName(selectedActivity.categoryId)}
       </Text>
     </View>
     ```
     Changes:
     - `TouchableOpacity` → `View`
     - Remove `onPress` prop
     - Remove the `MaterialIcons` edit icon
  3. Keep the `getCategoryName` helper function (lines 91-95) — it's still used for the read-only display.
- **Files**: `apps/mobile/src/screens/create-standard/SelectActivityStep.tsx` (lines 234-242)
- **Notes**: The category is still visible — users just can't tap it to change it inline anymore. Category changes happen through the Edit button (T010) → ActivityModal.

### Subtask T009 – Add `editModalVisible` state and `handleEditActivitySave` callback

- **Purpose**: Provide the state and logic needed to open ActivityModal in edit mode and handle saves.
- **Steps**:
  1. Add state variable after the existing `showActivityModal` state (around line 39):
     ```typescript
     const [editModalVisible, setEditModalVisible] = useState(false);
     ```
  2. Add the save handler callback (after `handleCreatedActivitySelect`, around line 78):
     ```typescript
     const handleEditActivitySave = useCallback(
       async (
         activityData: Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'>,
       ) => {
         if (!selectedActivity) throw new Error('No activity selected');
         await updateActivity(selectedActivity.id, activityData);
         // Update the builder store with the new data so the UI reflects changes immediately
         setSelectedActivity({
           ...selectedActivity,
           ...activityData,
           updatedAtMs: Date.now(),
         });
         return { ...selectedActivity, ...activityData, updatedAtMs: Date.now() };
       },
       [selectedActivity, updateActivity, setSelectedActivity],
     );
     ```
  3. The return value matches `Promise<Activity>` as expected by `ActivityModal.onSave`.
- **Files**: `apps/mobile/src/screens/create-standard/SelectActivityStep.tsx`
- **Notes**:
  - `updateActivity` is already destructured from `useActivities()` on line 32.
  - The `setSelectedActivity` call ensures the selection details panel (name, unit, category) updates immediately without waiting for the Firestore snapshot listener.
  - The spread `{ ...selectedActivity, ...activityData }` correctly merges: `activityData` contains `name`, `unit`, `notes`, `categoryId` which overwrite the corresponding fields on `selectedActivity`.

### Subtask T010 – Add Edit button in selected activity details panel

- **Purpose**: Give users a way to edit the selected activity from within the Create Standard flow (FR-007, FR-008, FR-009).
- **Steps**:
  1. In the `selectionDetails` panel JSX (lines 224-243), add an Edit button. Place it after the activity name and before the detail rows:
     ```tsx
     {selectedActivity && (
       <View style={[styles.selectionDetails, { borderTopColor: theme.border.primary }]}>
         <View style={styles.selectionHeaderRow}>
           <Text style={[styles.selectionLabel, { color: theme.text.primary }]}>
             {selectedActivity.name}
           </Text>
           <TouchableOpacity
             style={[styles.editButton, { borderColor: theme.button.primary.background }]}
             onPress={() => setEditModalVisible(true)}
           >
             <MaterialIcons name="edit" size={14} color={theme.button.primary.background} />
             <Text style={[styles.editButtonText, { color: theme.button.primary.background }]}>
               Edit
             </Text>
           </TouchableOpacity>
         </View>
         <View style={styles.detailRow}>
           <Text style={[styles.detailText, { color: theme.text.secondary }]}>
             Unit: {selectedActivity.unit || '(none)'}
           </Text>
         </View>
         <View style={styles.detailRow}>
           <Text style={[styles.detailText, { color: theme.text.secondary }]}>
             Category: {getCategoryName(selectedActivity.categoryId)}
           </Text>
         </View>
       </View>
     )}
     ```
  2. Add styles for the new elements:
     ```typescript
     selectionHeaderRow: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       marginBottom: 4,
     },
     editButton: {
       flexDirection: 'row',
       alignItems: 'center',
       gap: 4,
       paddingHorizontal: 10,
       paddingVertical: 4,
       borderRadius: 6,
       borderWidth: 1,
     },
     editButtonText: {
       fontSize: 13,
       fontWeight: '600',
     },
     ```
  3. The Edit button is only rendered inside the `{selectedActivity && (...)}` guard, so it naturally disappears when no activity is selected (FR-008).
- **Files**: `apps/mobile/src/screens/create-standard/SelectActivityStep.tsx`
- **Notes**: The Edit button uses an outlined style (border, no fill) with the primary color to make it discoverable but not dominant. The `MaterialIcons "edit"` icon provides visual affordance. Button label uses title case per UI copy conventions.

### Subtask T011 – Add `ActivityModal` in edit mode for selected activity

- **Purpose**: Wire up the actual modal that opens when the Edit button is tapped.
- **Steps**:
  1. Add a second `<ActivityModal>` instance below the existing one (after line 352). Place it just before the closing `</View>` of the component:
     ```tsx
     {/* Activity Modal for editing selected activity */}
     {selectedActivity && (
       <ActivityModal
         visible={editModalVisible}
         activity={selectedActivity}
         onClose={() => setEditModalVisible(false)}
         onSave={handleEditActivitySave}
       />
     )}
     ```
  2. Key prop differences from the create modal:
     - `activity={selectedActivity}` — puts the modal in **edit mode** (pre-populates all fields including the new Category picker from WP01)
     - `visible={editModalVisible}` — controlled by the Edit button
     - No `onSelect` prop — not needed for edit mode (the activity is already selected)
     - No `onDelete` prop — deleting an activity from the create flow would be confusing UX
  3. The `{selectedActivity && (...)}` guard prevents rendering when no activity is selected, avoiding potential null reference issues.
- **Files**: `apps/mobile/src/screens/create-standard/SelectActivityStep.tsx`
- **Notes**:
  - When the user saves in the edit modal, `handleEditActivitySave` (T009) calls `updateActivity` and updates the builder store. The modal closes via `onClose`.
  - The existing create modal (line 347-352) remains unchanged — it handles "Create New Activity" button presses.
  - Two `ActivityModal` instances exist but only one is visible at a time, controlled by separate boolean states.

## Risks & Mitigations

- **Risk**: Stale `selectedActivity` in builder store after edit → **Mitigation**: `handleEditActivitySave` explicitly calls `setSelectedActivity()` with merged data, so the UI updates immediately.
- **Risk**: User edits activity unit after proceeding to Step 2 then navigating back → **Mitigation**: The builder store holds the latest `selectedActivity` reference. If they go back and edit, the updated activity propagates forward because Step 2 reads from the store.
- **Risk**: Two `ActivityModal` instances mounted simultaneously causing performance issues → **Mitigation**: The edit modal is conditionally rendered only when `selectedActivity` is truthy. When `visible=false`, the Modal component doesn't render its children. Minimal performance impact.
- **Risk**: `updateActivity` call fails → **Mitigation**: `ActivityModal` already handles save errors and displays them in the modal. The user can retry or cancel.

## Review Guidance

- **Key checkpoints**:
  - [ ] No category picker overlay appears anywhere on SelectActivityStep
  - [ ] No dead code: `showCategoryPicker`, `handleCategoryChange`, overlay JSX, picker styles — all removed
  - [ ] Category still displayed as read-only text in selection details (e.g., "Category: Fitness")
  - [ ] Edit button visible when activity is selected, hidden when not
  - [ ] Tapping Edit opens ActivityModal in edit mode with name, unit, category, notes pre-populated
  - [ ] Category field in the edit modal shows the correct current category (requires WP01)
  - [ ] After changing category in edit modal and saving, the selection details update immediately
  - [ ] After changing name/unit in edit modal and saving, the selection details update immediately
  - [ ] Canceling the edit modal makes no changes
  - [ ] "Create New Activity" button still works correctly (unchanged)

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

### How to Add Activity Log Entries

**When adding an entry**:
1. Scroll to the bottom of this file (Activity Log section below "Valid lanes")
2. **APPEND the new entry at the END** (do NOT prepend or insert in middle)
3. Use exact format: `- YYYY-MM-DDTHH:MM:SSZ – agent_id – lane=<lane> – <action>`
4. Timestamp MUST be current time in UTC (check with `date -u "+%Y-%m-%dT%H:%M:%SZ"`)
5. Lane MUST match the frontmatter `lane:` field exactly
6. Agent ID should identify who made the change (claude-sonnet-4-5, codex, etc.)

**Format**:
```
- YYYY-MM-DDTHH:MM:SSZ – <agent_id> – lane=<lane> – <brief action description>
```

**Initial entry**:
- 2026-02-12T01:43:15Z – system – lane=planned – Prompt created.

---

### Updating Lane Status

To change a work package's lane, either:

1. **Edit directly**: Change the `lane:` field in frontmatter AND append activity log entry (at the end)
2. **Use CLI**: `spec-kitty agent tasks move-task WP02 --to <lane> --note "message"` (recommended)

**Valid lanes**: `planned`, `doing`, `for_review`, `done`
- 2026-02-12T02:12:06Z – claude-opus – shell_pid=86643 – lane=doing – Assigned agent via workflow command
