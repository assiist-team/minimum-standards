# Task Breakdown: Fast Logging (per-standard + global)

## Overview
Total Tasks: 20

## Task List

### Modal Extension & Standard Picker

#### Task Group 1: Extend LogEntryModal for dual entry points
**Dependencies:** None

- [x] 1.0 Extend LogEntryModal to support optional standard prop and standard picker
  - [x] 1.1 Write 4-6 focused component tests covering: standard picker rendering when standard is null, standard selection transitions to form, form reset on modal open/close, and validation with zero values.
  - [x] 1.2 Make `standard` prop optional (`Standard | null | undefined`) in `LogEntryModalProps` interface.
  - [x] 1.3 Add state management for standard picker step (`selectedStandard` state, `showPicker` boolean derived from `standard === null`).
  - [x] 1.4 Implement standard picker UI using `useStandards().activeStandards` hook, rendering FlatList of standards with `standard.summary` display.
  - [x] 1.5 Add loading state while fetching standards (show ActivityIndicator when `useStandards().loading` is true).
  - [x] 1.6 Add empty state when no active standards exist with message "No active standards. Create one in Standards Builder."
  - [x] 1.7 Implement standard selection handler that sets `selectedStandard` and transitions to logging form.
  - [x] 1.8 Update form reset logic in `useEffect` to reset all state (value, note, showNote, showWhen, selectedDate) when modal opens/closes or standard changes.
  - [x] 1.9 Update conditional rendering to show picker when `standard === null`, otherwise show existing form.
  - [x] 1.10 Run only the tests from 1.1 to verify picker and form transitions work correctly.

**Acceptance Criteria:**
- Modal shows standard picker when `standard={null}` is passed.
- Picker displays active standards with summary text.
- Selecting a standard transitions to logging form with that standard pre-selected.
- Form state resets correctly on modal open/close and standard changes.
- Tests from 1.1 pass.

### Backdating Control

#### Task Group 2: "When?" date/time picker implementation
**Dependencies:** Task Group 1

- [x] 2.0 Add collapsible "When?" backdating control
  - [x] 2.1 Write 3-5 focused tests covering: collapsed state defaults to current time, expand/collapse toggle, date/time selection updates occurredAtMs, "Now" button resets to current time, and selected date displays in readable format.
  - [x] 2.2 Add `showWhen` state (boolean, default false) and `selectedDate` state (Date, default `new Date()`).
  - [x] 2.3 Implement collapsible section UI following `ActivityModal` pattern: "+ When?" button when collapsed, expand to reveal date/time picker.
  - [x] 2.4 Install and configure `@react-native-community/datetimepicker` package (or use platform-specific DatePickerIOS for iOS).
  - [x] 2.5 Implement date/time picker component with platform-appropriate styling (modal on iOS, inline on Android or consistent via community package).
  - [x] 2.6 Add "Now" button that resets `selectedDate` to `new Date()` when picker is expanded.
  - [x] 2.7 Format selected date/time for display (e.g., "Dec 12, 2024 at 2:30 PM") using `Intl.DateTimeFormat` or similar.
  - [x] 2.8 Update `handleSave` to use `selectedDate.getTime()` for `occurredAtMs` instead of always using `Date.now()`.
  - [x] 2.9 Ensure picker is accessible with proper `accessibilityLabel` and minimum 44px touch targets.
  - [x] 2.10 Run only the tests from 2.1 to verify date/time picker functionality.

**Acceptance Criteria:**
- "When?" section is collapsed by default and shows "+ When?" button.
- Expanding reveals date/time picker with current time as default.
- Selecting past dates/times updates the selected date state.
- "Now" button resets to current time.
- Selected date displays in readable format.
- `occurredAtMs` uses selected date/time instead of always `Date.now()`.
- Tests from 2.1 pass.

### Validation & Zero Value Support

#### Task Group 3: Update validation to support zero values
**Dependencies:** Task Group 1

- [x] 3.0 Update validation and schema to allow zero values
  - [x] 3.1 Write 2-3 focused tests covering: zero value is accepted as valid input, negative values are rejected, and zero values save successfully to Firestore.
  - [x] 3.2 Update validation in `handleSave` to change from `numValue < 0` to `numValue < 0` check (allowing zero, rejecting negatives).
  - [x] 3.3 Verify `activityLogSchema` in `packages/shared-model` accepts zero values (should already support `z.number().min(0)` per spec).
  - [x] 3.4 Ensure zero values display normally in input field and save successfully.
  - [x] 3.5 Update error messages to clarify that zero is valid (e.g., "Please enter a valid number (zero or greater)").
  - [x] 3.6 Run only the tests from 3.1 to verify zero value support.

**Acceptance Criteria:**
- Zero values are accepted as valid input.
- Negative values are rejected with clear error message.
- Zero values save successfully to Firestore.
- Schema validation accepts zero values.
- Tests from 3.1 pass.

### Global Entry Point

#### Task Group 4: Add global logging button to HomeScreen
**Dependencies:** Task Groups 1-2

- [x] 4.0 Integrate global logging entry point on HomeScreen
  - [x] 4.1 Write 2-3 focused tests covering: button opens LogEntryModal with standard=null, modal shows standard picker, and successful log closes modal and returns to HomeScreen.
  - [x] 4.2 Add "Log Activity" button to `HomeScreen` component in `apps/mobile/App.tsx` matching existing button style.
  - [x] 4.3 Add state management for LogEntryModal visibility (`logModalVisible` state).
  - [x] 4.4 Wire button to open `LogEntryModal` with `standard={null}` prop.
  - [x] 4.5 Implement `handleLogSave` callback that calls `useStandards().createLogEntry` (or appropriate hook method).
  - [x] 4.6 Ensure modal closes immediately after successful save (existing behavior).
  - [x] 4.7 Place button alongside existing navigation buttons with consistent styling and spacing.
  - [x] 4.8 Run only the tests from 4.1 to verify HomeScreen integration.

**Acceptance Criteria:**
- "Log Activity" button appears on HomeScreen with consistent styling.
- Button opens LogEntryModal with standard picker (standard=null).
- Successful log entry closes modal and returns to HomeScreen.
- Button placement matches existing navigation button layout.
- Tests from 4.1 pass.

### Error Handling & Accessibility

#### Task Group 5: Polish error handling, accessibility, and theming
**Dependencies:** Task Groups 1-4

- [x] 5.0 Enhance error handling, accessibility, and theme support
  - [x] 5.1 Write 2-3 focused tests covering: error display for invalid input, error handling when no active standards, and accessibility labels for all interactive elements.
  - [x] 5.2 Update error handling to show inline error for invalid numeric input (zero allowed, negatives rejected).
  - [x] 5.3 Add error message display when standard picker has no active standards available.
  - [x] 5.4 Prevent closing modal while saving is in progress (disable close button during save - already implemented, verify).
  - [x] 5.5 Add descriptive `accessibilityLabel` strings for: "When?" button, date picker controls, standard picker items, and "Now" button.
  - [x] 5.6 Ensure date/time picker meets accessibility requirements (44px minimum touch targets, proper labels).
  - [x] 5.7 Verify light/dark theme support using existing theme tokens (no hard-coded colors).
  - [x] 5.8 Maintain keyboard navigation support for form inputs (verify existing behavior).
  - [x] 5.9 Run only the tests from 5.1 to verify error handling and accessibility.

**Acceptance Criteria:**
- Error messages display correctly for invalid input and empty standard lists.
- Modal cannot be closed while saving is in progress.
- All interactive elements have descriptive accessibility labels.
- Date/time picker meets accessibility requirements.
- Theme support works correctly in light and dark modes.
- Tests from 5.1 pass.

### Feature QA & Integration Testing

#### Task Group 6: End-to-end workflow validation
**Dependencies:** Task Groups 1-5

- [x] 6.0 Validate end-to-end logging workflows
  - [x] 6.1 Review tests from groups 1-5 and identify remaining gaps (standard picker flow, backdating flow, zero value logging, global entry point).
  - [x] 6.2 Add up to 6 additional integration tests (Detox/Jest) covering: logging from dashboard with pre-selected standard, logging from HomeScreen with standard picker, backdating a log entry, logging zero value, error recovery flows, and modal state reset on navigation.
  - [x] 6.3 Run only the feature-specific suites (tests from 1.1, 2.1, 3.1, 4.1, 5.1, 6.2) and record results.
  - [x] 6.4 Verify Firestore listeners automatically update Active Standards Dashboard progress after logging (no manual refresh needed).
  - [x] 6.5 File/flag any blocking defects before handing off for review.

**Acceptance Criteria:**
- Feature-specific tests pass (approximately 19-28 tests total).
- Per-standard logging from dashboard works correctly.
- Global logging from HomeScreen with standard picker works correctly.
- Backdating log entries works correctly.
- Zero values log successfully.
- Firestore listeners update dashboard progress automatically.
- Documented gaps (if any) have follow-up tickets.

## Execution Order
1. Modal Extension & Standard Picker (Task Group 1)
2. Backdating Control (Task Group 2) - Can run in parallel with Task Group 3
3. Validation & Zero Value Support (Task Group 3) - Can run in parallel with Task Group 2
4. Global Entry Point (Task Group 4)
5. Error Handling & Accessibility (Task Group 5)
6. Feature QA & Integration Testing (Task Group 6)
