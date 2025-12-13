# Spec Requirements: Edit/delete logs

## Initial Description

Edit/delete logs (explicit + auditable) — Add explicit edit and delete actions for logs (prefer `editedAt` and soft-delete via `deletedAt`) and ensure totals/status recompute deterministically and immediately everywhere. `[S]`

## Requirements Discussion

### First Round Questions

**Q1:** I assume edit and delete actions will appear in the `PeriodLogsModal` (the modal that shows logs for a selected period). Is that correct, or should they also be accessible from the `StandardDetailScreen` history list?

**Answer:** Edit and delete actions will appear in the period logs modal.

**Q2:** For editing, I'm thinking we should extend the existing `LogEntryModal` to support edit mode (similar to how `ActivityModal` handles both create and edit). Should we reuse `LogEntryModal` for editing, or create a separate edit modal?

**Answer:** Extending LogEntryModal for editing makes sense (similar to how ActivityModal handles both create and edit).

**Q3:** I assume users can edit all log fields: value, note, and occurredAt (the "When?" date/time). Is that correct, or should some fields be read-only?

**Answer:** Correct - all fields (value, note, occurredAt) are editable.

**Q4:** For delete confirmation, I'm thinking we should use `Alert.alert` with a destructive "Delete" button (similar to the Activity delete pattern). Should we also include an undo snackbar like Activities have, or is a simple confirmation sufficient?

**Answer:** Include undo snackbar (similar to Activities pattern).

**Q5:** I assume edited logs should show a visual indicator (e.g., "Edited" badge or icon) in the logs list. Should this indicator be subtle or prominent?

**Answer:** Subtle visual indicator.

**Q6:** I'm thinking we should prevent editing/deleting logs for archived standards (similar to how archived standards can't be logged). Should we enforce this restriction, or allow editing/deleting logs even if the standard is later archived?

**Answer:** That's fine - prevent editing/deleting logs for archived standards.

**Q7:** The roadmap mentions ensuring totals/status recompute "immediately everywhere." I assume this means Firestore listeners will automatically update the dashboard and detail screens. Should we also show optimistic UI updates (immediate visual feedback before Firestore confirms), or wait for the server response?

**Answer:** If Firestore updates are fast enough, we don't need optimistic UI updates.

**Q8:** Are there any specific scenarios or edge cases we should exclude from this feature? For example, bulk operations, editing multiple logs at once, or restoring deleted logs?

**Answer:** No specific scenarios or edge cases to exclude.

### Existing Code to Reference

No similar existing features identified for reference.

### Follow-up Questions

No follow-up questions were needed.

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

No visual assets provided.

## Requirements Summary

### Functional Requirements

- Add edit and delete actions to `PeriodLogsModal` for individual log entries
- Extend `LogEntryModal` to support edit mode (similar to `ActivityModal` create/edit pattern)
- Allow editing of all log fields: value, note, and occurredAt (date/time)
- Implement delete confirmation using `Alert.alert` with destructive "Delete" button
- Include undo snackbar for deleted logs (similar to Activities undo pattern)
- Show subtle visual indicator for edited logs in the logs list
- Prevent editing/deleting logs for archived standards
- Use Firestore listeners for automatic UI updates (no optimistic updates needed)
- Set `editedAtMs` timestamp when a log is edited
- Use soft-delete via `deletedAtMs` for deleted logs
- Ensure totals and status recompute deterministically and immediately everywhere after edits/deletes

### Reusability Opportunities

- Reuse `LogEntryModal` component pattern (extend for edit mode)
- Reference `ActivityModal` create/edit pattern as a model
- Reuse `Alert.alert` delete confirmation pattern from Activity delete flow
- Reuse undo snackbar pattern from Activity delete flow
- Leverage existing Firestore listener patterns for automatic UI updates

### Scope Boundaries

**In Scope:**
- Edit and delete actions in `PeriodLogsModal`
- Extending `LogEntryModal` for edit mode
- Editing all log fields (value, note, occurredAt)
- Delete confirmation with undo snackbar
- Subtle visual indicator for edited logs
- Preventing edits/deletes for archived standards
- Setting `editedAtMs` on edit
- Soft-delete via `deletedAtMs` on delete
- Automatic recomputation of totals/status via Firestore listeners

**Out of Scope:**
- Bulk operations or editing multiple logs at once
- Restoring deleted logs (beyond undo snackbar)
- Optimistic UI updates
- Edit/delete actions from `StandardDetailScreen` history list (only in `PeriodLogsModal`)

### Technical Considerations

- Integration with existing `PeriodLogsModal` component
- Extending `LogEntryModal` to support edit mode (similar to `ActivityModal` pattern)
- Firestore listeners will handle automatic UI updates (no optimistic updates needed)
- Use existing `editedAtMs` and `deletedAtMs` fields in `ActivityLog` type
- Follow existing soft-delete pattern (logs already filtered by `deletedAtMs` in queries)
- Reuse existing delete confirmation and undo patterns from Activity delete flow
- Ensure Firestore security rules allow updates to `editedAt` and `deletedAt` fields
- Period totals and status will recompute automatically via existing period calculator logic
