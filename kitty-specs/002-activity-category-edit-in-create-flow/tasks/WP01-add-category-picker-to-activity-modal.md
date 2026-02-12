---
work_package_id: WP01
title: Add Category Picker to ActivityModal
lane: "doing"
dependencies: []
base_branch: main
base_commit: 74c51e1711556e38b3bcb0c151ffb492da159721
created_at: '2026-02-12T01:50:14.451502+00:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
phase: Phase 1 - Core Modal Enhancement
assignee: ''
agent: "claude-opus"
shell_pid: "66638"
review_status: ''
reviewed_by: ''
history:
- timestamp: '2026-02-12T01:43:15Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP01 – Add Category Picker to ActivityModal

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
spec-kitty implement WP01
```

No dependencies — this WP branches from the target branch directly.

---

## Objectives & Success Criteria

Add a Category picker field to `ActivityModal` so users can set or change an activity's category during creation (US1) and editing (US2). This addresses FR-001 through FR-006.

**Success criteria:**
- Category picker field appears between Unit and Notes in both create and edit modes (FR-001, FR-002)
- Picker shows "None" followed by all user-defined categories (FR-003)
- Create mode defaults to "None" (FR-004)
- Edit mode shows the activity's current category (FR-005)
- Selected category persists as `categoryId` on save (FR-006)

## Context & Constraints

- **File to modify**: `apps/mobile/src/components/ActivityModal.tsx` (~428 lines currently)
- **Spec**: `kitty-specs/002-activity-category-edit-in-create-flow/spec.md`
- **Plan**: `kitty-specs/002-activity-category-edit-in-create-flow/plan.md` — Change 1
- **Data model**: No schema changes. `Activity.categoryId` (string | null) already exists in `@minimum-standards/shared-model`
- **Research**: `useActivities().createActivity` and `updateActivity` both support `categoryId` already. The gap is purely in the modal UI.
- **Pattern to follow**: `BottomSheetMenu` component — same pattern used in `ActivitySettingsScreen` for category assignment.
- **Constraint**: The save handler at line ~122 already includes `categoryId` in the payload but reads it from `activity?.categoryId ?? null` (the prop). We need to change it to read from the new state variable.

## Subtasks & Detailed Guidance

### Subtask T001 – Import `useCategories` and `BottomSheetMenu`

- **Purpose**: Make the categories data and bottom sheet picker available in the component.
- **Steps**:
  1. Add import for `useCategories` hook:
     ```typescript
     import { useCategories } from '../hooks/useCategories';
     ```
  2. Add import for `BottomSheetMenu` component:
     ```typescript
     import { BottomSheetMenu } from './BottomSheetMenu';
     ```
  3. Add import for `MaterialIcons` (needed for the chevron icon on the picker row):
     ```typescript
     import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
     ```
- **Files**: `apps/mobile/src/components/ActivityModal.tsx` (lines 1-19, imports section)
- **Notes**: Check if `MaterialIcons` is already imported — it is NOT in the current file. The `BottomSheetMenu` and `useCategories` are already used elsewhere in the app so the imports are straightforward.

### Subtask T002 – Add `categoryId` and `categoryPickerVisible` state

- **Purpose**: Track the user's category selection and control the picker's visibility.
- **Steps**:
  1. Inside the component function (after existing state declarations around line 44-57), add:
     ```typescript
     const { orderedCategories } = useCategories();
     const [categoryId, setCategoryId] = useState<string | null>(activity?.categoryId ?? null);
     const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
     ```
  2. In the existing `useEffect` that resets form fields when `activity` or `visible` changes (look for the effect that sets `name`, `unit`, `notes` from `activity`), add a reset for `categoryId`:
     ```typescript
     setCategoryId(activity?.categoryId ?? null);
     ```
     This ensures that when the modal opens in edit mode, `categoryId` reflects the current activity's category, and when it opens in create mode, it resets to null.
  3. Also reset `categoryPickerVisible` to `false` in the same effect to ensure the picker doesn't stay open between modal opens.
- **Files**: `apps/mobile/src/components/ActivityModal.tsx` (lines 44-85 region)
- **Notes**: The existing `useEffect` around lines 59-78 resets `name`, `unit`, `notes`, `errors`, `saveError`. Add `categoryId` and `categoryPickerVisible` resets there.

### Subtask T003 – Add Category picker row JSX

- **Purpose**: Display a tappable row showing the current category selection, positioned between Unit and Notes (FR-002).
- **Steps**:
  1. Create a helper to get the display name for the current `categoryId`:
     ```typescript
     const categoryDisplayName = categoryId
       ? orderedCategories.find(c => c.id === categoryId)?.name ?? 'None'
       : 'None';
     ```
     Place this alongside the other derived values (near `isEditMode` / `isBusy`).
  2. Add the Category row JSX between the Unit `TextInput` block (ends around line 318) and the Notes `TextInput` block (starts around line 321):
     ```tsx
     {/* Category Field */}
     <TouchableOpacity
       style={[styles.fieldRow, { borderBottomColor: theme.border.primary }]}
       onPress={() => setCategoryPickerVisible(true)}
       disabled={isBusy}
     >
       <Text style={[styles.label, { color: theme.text.primary }]}>Category</Text>
       <View style={styles.fieldValueRow}>
         <Text style={[styles.fieldValue, { color: theme.text.secondary }]}>
           {categoryDisplayName}
         </Text>
         <MaterialIcons name="chevron-right" size={20} color={theme.text.secondary} />
       </View>
     </TouchableOpacity>
     ```
  3. Add the corresponding styles to the `StyleSheet.create` block:
     ```typescript
     fieldRow: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       paddingVertical: 14,
       borderBottomWidth: StyleSheet.hairlineWidth,
     },
     fieldValueRow: {
       flexDirection: 'row',
       alignItems: 'center',
       gap: 4,
     },
     fieldValue: {
       fontSize: 16,
     },
     ```
- **Files**: `apps/mobile/src/components/ActivityModal.tsx` (JSX around lines 289-321, styles around lines 430+)
- **Notes**: The style should match the pattern used in Settings screens — a row with label on left, value + chevron on right. `isBusy` disables the row while saving/deleting is in progress.

### Subtask T004 – Render `BottomSheetMenu` with category options

- **Purpose**: Show a bottom sheet picker with "None" plus all user-defined categories when the user taps the Category row.
- **Steps**:
  1. Build the menu items array. Place this logic near the top of the component (after the `categoryDisplayName` derivation):
     ```typescript
     const categoryMenuItems = [
       {
         key: 'none',
         label: 'None',
         onPress: () => setCategoryId(null),
       },
       ...orderedCategories
         .filter(c => !c.isSystem)
         .map(c => ({
           key: c.id,
           label: c.name,
           onPress: () => setCategoryId(c.id),
         })),
     ];
     ```
  2. Render the `BottomSheetMenu` component. Place it inside the `<Modal>` JSX, after the `ScrollView` and footer but before the closing `</View>` of the modal content (near the end of the JSX, around line 425):
     ```tsx
     <BottomSheetMenu
       visible={categoryPickerVisible}
       onRequestClose={() => setCategoryPickerVisible(false)}
       items={categoryMenuItems}
       title="Select Category"
     />
     ```
- **Files**: `apps/mobile/src/components/ActivityModal.tsx`
- **Notes**:
  - `BottomSheetMenu` accepts `visible`, `onRequestClose`, `items`, and optional `title` props.
  - The `onPress` for each item sets `categoryId` state — the menu auto-closes after item press (handled internally by `BottomSheetMenu` via deferred action execution).
  - System categories (like "Uncategorized") are filtered out with `!c.isSystem` — users should pick "None" instead of the system "Uncategorized" category.
  - If the user has no categories yet, only "None" appears in the list. This is correct per the edge case in the spec.

### Subtask T005 – Update save handler to use `categoryId` state

- **Purpose**: Ensure the user's category selection is included in the save payload (FR-006).
- **Steps**:
  1. In the `handleSave` function (around line 122), locate the `activitySchema.parse()` call. Change:
     ```typescript
     categoryId: activity?.categoryId ?? null,
     ```
     to:
     ```typescript
     categoryId: categoryId,
     ```
     (This reads from the `categoryId` state variable instead of the prop.)
  2. Verify that the `savePayload` object (around line 133-138) already includes `categoryId: activityData.categoryId ?? null` — it does, so no change needed there.
  3. Verify the `activitySchema` in `@minimum-standards/shared-model` accepts `categoryId: string | null` — per research.md, it does.
- **Files**: `apps/mobile/src/components/ActivityModal.tsx` (line ~126, inside `handleSave`)
- **Notes**: This is a one-line change but it's the critical wiring that makes the entire feature work. Without it, the category picker would appear to work but the selection would be silently discarded on save.

## Risks & Mitigations

- **Risk**: `orderedCategories` is empty on first render while Firestore subscription loads → **Mitigation**: The picker row still shows "None" which is correct. The `BottomSheetMenu` with only a "None" item is still functional.
- **Risk**: The `BottomSheetMenu` z-index could conflict with the `Modal` wrapper → **Mitigation**: `BottomSheetMenu` uses `BottomSheet` internally which renders as a React Native `Modal` — nested modals work correctly on both iOS and Android.
- **Risk**: The `categoryId` state could drift from the activity's actual `categoryId` if the activity is updated externally → **Mitigation**: The `useEffect` reset syncs state whenever the `activity` prop changes.

## Review Guidance

- **Key checkpoints**:
  - [ ] Category field is visible between Unit and Notes in both create and edit modes
  - [ ] Tapping the field opens a bottom sheet with "None" + user-defined categories
  - [ ] Create mode: field defaults to "None"
  - [ ] Edit mode: field shows the activity's current category
  - [ ] After selecting a category and saving, verify `categoryId` is persisted (check Firestore or re-open in edit mode)
  - [ ] Not selecting a category (leaving as "None") results in `categoryId: null`
  - [ ] The picker row is disabled while saving/deleting is in progress
  - [ ] No system categories (like "Uncategorized") appear in the picker list

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
2. **Use CLI**: `spec-kitty agent tasks move-task WP01 --to <lane> --note "message"` (recommended)

**Valid lanes**: `planned`, `doing`, `for_review`, `done`
- 2026-02-12T01:50:14Z – claude-opus – shell_pid=45737 – lane=doing – Assigned agent via workflow command
- 2026-02-12T01:52:58Z – claude-opus – shell_pid=45737 – lane=for_review – Ready for review: Category picker added to ActivityModal between Unit and Notes. BottomSheetMenu shows None + user-defined categories. Save handler wired to categoryId state.
- 2026-02-12T02:00:37Z – claude-opus – shell_pid=66638 – lane=doing – Started review via workflow command
