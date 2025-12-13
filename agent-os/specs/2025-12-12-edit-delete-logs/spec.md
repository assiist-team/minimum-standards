# Specification: Edit/delete logs

## Goal
Add explicit edit and delete actions for logs in the PeriodLogsModal, using `editedAtMs` for edits and soft-delete via `deletedAtMs` for deletions, ensuring totals and status recompute deterministically and immediately everywhere.

## User Stories
- As a user reviewing my logs, I want to edit or delete individual log entries so that I can correct mistakes or remove incorrect entries.
- As a user maintaining accurate records, I want deleted logs to be soft-deleted (with undo capability) so that accidental deletions can be recovered.

## Specific Requirements

**Edit and delete actions in PeriodLogsModal**
- Add edit and delete action buttons/icons to each log item in `PeriodLogsModal`.
- Actions appear inline with each log entry (e.g., edit/delete icons in the log item header).
- Actions are disabled/hidden if the associated standard is archived.
- Edit action opens `LogEntryModal` in edit mode with the log's current values pre-filled.

**Extend LogEntryModal for edit mode**
- Add optional `logEntry` prop to `LogEntryModal` (similar to `ActivityModal`'s `activity` prop).
- When `logEntry` is provided, modal operates in edit mode: pre-fill value, note, and occurredAt from the log entry.
- Modal title changes to "Edit Log" in edit mode (vs "Log Activity" in create mode).
- On save in edit mode, update the existing log entry instead of creating a new one.
- Set `editedAtMs` timestamp to current time when a log is edited.

**Edit all log fields**
- Allow editing of value (numeric input), note (optional text), and occurredAt (date/time picker).
- Use the same validation rules as create mode (value >= 0, note max 500 chars).
- Pre-populate the "When?" date/time picker with the log's current `occurredAtMs` value.

**Delete confirmation and undo**
- Show `Alert.alert` confirmation dialog with destructive "Delete" button when user taps delete action.
- Dialog message: "Are you sure you want to delete this log entry?"
- On confirmation, soft-delete the log by setting `deletedAtMs` to current timestamp.
- Show undo snackbar at bottom of `PeriodLogsModal` after deletion (similar to Activity delete pattern).
- Undo snackbar auto-dismisses after 5 seconds or when user taps "Undo".
- Tapping "Undo" restores the log by clearing `deletedAtMs` (set to null).

**Visual indicator for edited logs**
- Show subtle visual indicator (e.g., small "Edited" text or icon) in log items that have `editedAtMs` set.
- Indicator appears near the date/time display in the log item header.
- Use muted/secondary text color to keep it subtle.

**Prevent edits/deletes for archived standards**
- Check if the standard is archived before allowing edit/delete actions.
- Disable or hide edit/delete buttons if `standard.state === 'archived'` or `standard.archivedAtMs != null`.
- Show appropriate error message if user attempts to edit/delete a log for an archived standard.

**Automatic UI updates via Firestore listeners**
- Rely on existing Firestore listeners to automatically update UI after edits/deletes.
- No optimistic UI updates needed; wait for Firestore confirmation.
- Existing listeners in `usePeriodLogs`, `useActiveStandardsDashboard`, and `useStandardHistory` will automatically reflect changes.
- Period totals and status recompute automatically via existing period calculator logic.

**Firestore operations**
- Add `updateLogEntry` function to `useStandards` hook that updates value, note, occurredAt, and sets `editedAtMs`.
- Add `deleteLogEntry` function to `useStandards` hook that sets `deletedAtMs` to current timestamp.
- Add `restoreLogEntry` function to `useStandards` hook that clears `deletedAtMs` (sets to null).
- Ensure Firestore security rules allow updates to `editedAt` and `deletedAt` fields.

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**`apps/mobile/src/components/ActivityModal.tsx`**
- Reference the create/edit mode pattern: `isEditMode = !!activity` determines mode, form pre-fills from activity prop, title changes based on mode.
- Reuse the form initialization pattern in `useEffect` that resets or pre-fills based on edit mode.

**`apps/mobile/src/components/LogEntryModal.tsx`**
- Extend this component to support edit mode by adding optional `logEntry` prop.
- Reuse existing form structure (value input, note field, date/time picker) and validation logic.
- Reuse the "When?" collapsible date/time picker pattern for editing occurredAt.

**`apps/mobile/src/components/PeriodLogsModal.tsx`**
- Add edit/delete action buttons to the `LogItem` component.
- Add undo snackbar component similar to `ActivityLibraryScreen`'s snackbar pattern.
- Reuse existing modal structure and styling patterns.

**`apps/mobile/src/screens/ActivityLibraryScreen.tsx`**
- Reuse the `Alert.alert` delete confirmation pattern with destructive "Delete" button.
- Reuse the undo snackbar pattern with 5-second auto-dismiss timer and `scheduleUndoClear` logic.
- Reference the `restoreActivity` pattern for implementing `restoreLogEntry`.

**`apps/mobile/src/hooks/useStandards.ts`**
- Add `updateLogEntry`, `deleteLogEntry`, and `restoreLogEntry` functions following the same patterns as `createLogEntry`.
- Reuse the `canLogStandard` check pattern to prevent edits/deletes for archived standards.
- Leverage existing Firestore collection path and user scoping patterns.

**`apps/mobile/src/hooks/usePeriodLogs.ts`**
- Existing query already filters by `deletedAt` (excludes soft-deleted logs), so deleted logs will automatically disappear from the list.
- No changes needed; existing listener will automatically reflect updates.

**`packages/shared-model/src/types.ts`**
- `ActivityLog` type already includes `editedAtMs: TimestampMs | null` and `deletedAtMs` via `SoftDelete` type.
- No schema changes needed; existing types support the feature.

## Out of Scope
- Bulk operations or editing multiple logs at once.
- Restoring deleted logs beyond the 5-second undo window (no permanent restore UI).
- Optimistic UI updates (rely on Firestore listeners only).
- Edit/delete actions from `StandardDetailScreen` history list (only available in `PeriodLogsModal`).
- Hard delete functionality (only soft-delete via `deletedAtMs`).
- Editing logs from archived standards (prevented by design).
- Visual indicators showing who edited the log or edit history (only `editedAtMs` timestamp).
