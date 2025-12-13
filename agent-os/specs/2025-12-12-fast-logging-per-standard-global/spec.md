# Specification: Fast Logging (per-standard + global)

## Goal
Extend the existing `LogEntryModal` to support both per-standard and global logging entry points, adding a standard picker for global access and a collapsible "When?" backdating control, enabling fast, repeatable logging with optional notes and immediate UI updates.

## User Stories
- As a user logging from the dashboard, I want to tap Log on a standard and immediately enter a value so logging stays frictionless and fast.
- As a user logging from anywhere, I want to access a global logging button that lets me pick any active standard and log, so I don't need to navigate to the dashboard first.
- As a user catching up on missed logs, I want to backdate entries with a simple date/time picker so historical accuracy is maintained without complexity.

## Specific Requirements

**Extend LogEntryModal for dual entry points**
- Make `standard` prop optional (`Standard | null | undefined`); when provided, use existing pre-selected behavior.
- When `standard` is null/undefined, show a standard picker step before the logging form.
- Maintain existing modal presentation, styling, and form structure (big numeric input, optional note, explicit save).
- Reset form state (value, note, showNote, showWhen) when modal opens/closes or standard changes.

**Standard picker for global entry**
- Query active standards via `useStandards().activeStandards` (filtered to non-archived, non-deleted).
- Render picker as a simple list/FlatList of standards showing `standard.summary` (e.g., "1000 calls / week").
- On standard selection, transition to the logging form with that standard pre-selected.
- Show loading state while fetching standards; show empty state if no active standards exist with message "No active standards. Create one in Standards Builder."

**"When?" backdating control**
- Add collapsible section (collapsed by default) similar to note field pattern from `ActivityModal`.
- Show "+ When?" button when collapsed; expand to reveal date/time picker.
- Default to current time (`Date.now()`) when collapsed; allow selection of past dates/times.
- Use React Native's built-in date picker (`@react-native-community/datetimepicker` for cross-platform or `DatePickerIOS` for iOS-specific).
- Display selected date/time in readable format (e.g., "Dec 12, 2024 at 2:30 PM") when expanded.
- Include "Now" button to reset to current time when picker is expanded.
- Pass selected `occurredAtMs` timestamp to `onSave` callback instead of always using `Date.now()`.

**Zero value support**
- Update validation to allow `value: 0` as valid (change from `numValue < 0` to `numValue < 0` check, allowing zero).
- Ensure schema validation (`activityLogSchema`) accepts zero values (already supported per schema: `z.number().min(0)`).
- Display zero values normally in the input field and save successfully.

**Post-save behavior**
- After successful save, close modal immediately and return to previous screen (no "Log another" flow).
- Show success confirmation via existing ToastAndroid/Alert pattern before closing.
- Firestore listeners on Active Standards Dashboard will automatically update progress (no manual refresh needed).
- Reset all form state (value, note, showNote, showWhen, selectedDate) on close.

**Global logging entry point on HomeScreen**
- Add "Log Activity" button to `HomeScreen` component (`apps/mobile/App.tsx`) matching existing button style.
- Button should open `LogEntryModal` with `standard={null}` to trigger standard picker flow.
- Place button alongside existing navigation buttons (Activity Library, Standards Builder, etc.).
- Use consistent styling and spacing with other home screen buttons.

**Validation and error handling**
- Validate numeric input: allow zero, reject negative numbers, show inline error for invalid input.
- Show error message if standard picker has no active standards available.
- Handle save errors with existing error display pattern (inline error text below input).
- Prevent closing modal while saving is in progress (disable close button during save).

**Accessibility and theming**
- Ensure date/time picker is accessible with proper labels and touch targets (44px minimum).
- Support light/dark themes using existing theme tokens (no hard-coded colors).
- Add descriptive `accessibilityLabel` for "When?" button and date picker controls.
- Maintain keyboard navigation support for form inputs.

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**apps/mobile/src/components/LogEntryModal.tsx**
- Extend this component to support optional standard prop and add standard picker step.
- Reuse existing form patterns: big numeric input (`valueInput` style), collapsed note field (`showNote` state pattern), explicit save button.
- Maintain existing modal presentation (`Modal` with `slide` animation, overlay, rounded top corners).
- Reuse existing validation, error handling, and save flow patterns.

**apps/mobile/src/components/ActivityModal.tsx**
- Reference collapsible field pattern (`showNote` state and conditional rendering) for implementing "When?" collapsible section.
- Reuse similar button styling and form field layout patterns.
- Follow same modal header structure (title, close button) and form spacing.

**apps/mobile/src/hooks/useStandards.ts**
- Use `activeStandards` property to fetch list of standards for picker.
- Leverage `createLogEntry` function for saving log entries (already handles Firestore writes).
- Ensure `canLogStandard` check is respected (archived standards cannot be logged).

**apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx**
- Reference how `LogEntryModal` is currently invoked with pre-selected standard.
- Follow same pattern for opening modal from HomeScreen (state management, visibility control).
- Reuse `handleLogSave` callback pattern for handling save completion.

**@react-native-community/datetimepicker or DatePickerIOS**
- Use React Native's built-in date/time picker components for cross-platform date selection.
- Follow platform-specific patterns: modal picker on iOS, inline picker on Android (or use community package for consistency).

## Out of Scope
- Search functionality within standard picker (simple list is sufficient).
- "Log another" flow or keeping modal open after save (close immediately).
- Future-dating restrictions (no explicit constraints on date selection).
- Separate screen/component for global logging (extend existing modal).
- Quick-add chips or "Last value" shortcuts (future enhancement per roadmap).
- Auto-save functionality (explicit save button required).
- Batch logging or multiple entries in one session.
- Log editing/deleting UI (handled by future feature per roadmap).
- Standard detail screen integration (separate feature).
- Analytics events beyond existing `trackStandardEvent` patterns.
