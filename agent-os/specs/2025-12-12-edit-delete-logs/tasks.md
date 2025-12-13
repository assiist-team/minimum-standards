# Task Breakdown: Edit/Delete Logs

## Overview
Total Tasks: 20

## Task List

### Data Layer & Firestore Operations

#### Task Group 1: Extend useStandards hook with log operations
**Dependencies:** None

- [x] 1.0 Add log update, delete, and restore operations
  - [x] 1.1 Write 3-5 focused unit tests covering updateLogEntry, deleteLogEntry, and restoreLogEntry functions with archived standard checks.
  - [x] 1.2 Add `updateLogEntry` function to `useStandards` hook that updates value, note, occurredAt, and sets `editedAtMs` to current timestamp.
  - [x] 1.3 Add `deleteLogEntry` function to `useStandards` hook that sets `deletedAtMs` to current timestamp (soft-delete).
  - [x] 1.4 Add `restoreLogEntry` function to `useStandards` hook that clears `deletedAtMs` (sets to null).
  - [x] 1.5 Ensure all three functions check `canLogStandard` to prevent operations on archived standards.
  - [x] 1.6 Run only the tests from 1.1 to verify hook behavior.

**Acceptance Criteria:**
- All three functions properly update Firestore with correct timestamps.
- Functions reject operations on archived standards with appropriate error messages.
- Tests from 1.1 pass.

### UI Components - LogEntryModal

#### Task Group 2: Extend LogEntryModal for edit mode
**Dependencies:** Task Group 1

- [x] 2.0 Add edit mode support to LogEntryModal
  - [x] 2.1 Write 3-4 component tests (RNTL) covering edit mode initialization, form pre-filling, title changes, and save behavior.
  - [x] 2.2 Add optional `logEntry` prop to `LogEntryModal` (similar to `ActivityModal`'s `activity` prop).
  - [x] 2.3 Implement `isEditMode = !!logEntry` pattern to determine mode.
  - [x] 2.4 Pre-fill form fields (value, note, occurredAt) from logEntry when in edit mode.
  - [x] 2.5 Change modal title to "Edit Log" in edit mode vs "Log Activity" in create mode.
  - [x] 2.6 Update `onSave` callback signature to handle both create and edit modes (accept optional logEntryId).
  - [x] 2.7 Pre-populate "When?" date/time picker with log's current `occurredAtMs` value in edit mode.
  - [x] 2.8 Run only the tests from 2.1 to verify UI flows.

**Acceptance Criteria:**
- Modal correctly switches between create and edit modes based on logEntry prop.
- Form fields pre-populate correctly in edit mode.
- Title changes appropriately based on mode.
- Tests from 2.1 pass.

### UI Components - PeriodLogsModal

#### Task Group 3: Add edit/delete actions to PeriodLogsModal
**Dependencies:** Task Groups 1-2

- [x] 3.0 Add edit and delete action buttons to log items
  - [x] 3.1 Write 3-4 component tests (RNTL) covering edit button opens modal, delete shows confirmation, actions disabled for archived standards.
  - [x] 3.2 Add edit and delete action buttons/icons to each log item in `LogItem` component.
  - [x] 3.3 Position actions inline with log item header (e.g., edit/delete icons next to date/time).
  - [x] 3.4 Wire edit button to open `LogEntryModal` in edit mode with log's current values.
  - [x] 3.5 Wire delete button to show `Alert.alert` confirmation dialog with destructive "Delete" button.
  - [x] 3.6 Pass standard to PeriodLogsModal and check if archived to disable/hide edit/delete buttons.
  - [x] 3.7 Run only the tests from 3.1 to verify UI flows.

**Acceptance Criteria:**
- Edit and delete buttons appear on each log item.
- Edit opens modal in edit mode with pre-filled values.
- Delete shows confirmation dialog.
- Actions are disabled/hidden for archived standards.
- Tests from 3.1 pass.

#### Task Group 4: Add undo snackbar and visual indicators
**Dependencies:** Task Group 3

- [x] 4.0 Implement undo snackbar and edited indicator
  - [x] 4.1 Write 2-3 component tests (RNTL) covering undo snackbar display, auto-dismiss, and undo action.
  - [x] 4.2 Add undo snackbar component at bottom of `PeriodLogsModal` (similar to ActivityLibraryScreen pattern).
  - [x] 4.3 Show snackbar after deletion with "Log entry deleted" message and "Undo" button.
  - [x] 4.4 Implement 5-second auto-dismiss timer using `scheduleUndoClear` pattern.
  - [x] 4.5 Wire "Undo" button to call `restoreLogEntry` function.
  - [x] 4.6 Add subtle visual indicator (e.g., small "Edited" text or icon) for logs with `editedAtMs` set.
  - [x] 4.7 Position edited indicator near date/time display in log item header with muted/secondary text color.
  - [x] 4.8 Update `usePeriodLogs` hook to include `editedAtMs` in PeriodLogEntry type and pass it through.
  - [x] 4.9 Run only the tests from 4.1 to verify UI flows.

**Acceptance Criteria:**
- Undo snackbar appears after deletion and auto-dismisses after 5 seconds.
- Undo button restores deleted log entry.
- Edited indicator appears for logs with `editedAtMs` set.
- Tests from 4.1 pass.

### Firestore Security Rules

#### Task Group 5: Update Firestore security rules
**Dependencies:** Task Group 1

- [x] 5.0 Ensure security rules allow log updates
  - [x] 5.1 Write 2-3 Firestore rules tests covering update of `editedAt` and `deletedAt` fields.
  - [x] 5.2 Update Firestore security rules to allow updates to `editedAt` and `deletedAt` fields in activityLogs collection.
  - [x] 5.3 Ensure rules still prevent updates to other critical fields (standardId, createdAt, etc.) except by authorized operations.
  - [x] 5.4 Run Firestore rules tests to verify security rules behavior.

**Acceptance Criteria:**
- Security rules allow updates to `editedAt` and `deletedAt` fields.
- Rules prevent unauthorized field updates.
- Firestore rules tests pass.

### Integration & Testing

#### Task Group 6: End-to-end validation
**Dependencies:** Task Groups 1-5

- [x] 6.0 Validate complete edit/delete workflow
  - [x] 6.1 Review tests from groups 1-5 and identify any remaining gaps.
  - [x] 6.2 Add 2-3 integration tests (Detox or high-level Jest) covering: edit log flow, delete with undo, and archived standard restrictions.
  - [x] 6.3 Verify that period totals and status recompute automatically after edits/deletes via Firestore listeners.
  - [x] 6.4 Run all feature-specific test suites (tests from 1.1, 2.1, 3.1, 4.1, 5.1, 6.2) and record results.
  - [x] 6.5 File/flag any blocking defects before handing off for review.

**Acceptance Criteria:**
- All feature-specific tests pass.
- Edit and delete workflows behave correctly on device/emulator.
- Period totals update automatically after edits/deletes.
- Documented gaps (if any) have follow-up tickets.

## Execution Order
1. Data Layer & Firestore Operations (Task Group 1)
2. UI Components - LogEntryModal (Task Group 2)
3. UI Components - PeriodLogsModal (Task Groups 3-4)
4. Firestore Security Rules (Task Group 5)
5. Integration & Testing (Task Group 6)
