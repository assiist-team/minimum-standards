# Task Breakdown: Truthful, low-friction UX + error handling

## Overview
Total Tasks: 28

## Task List

### Verification & Audit

#### Task Group 1: Zero value logging verification
**Dependencies:** None

- [x] 1.0 Verify zero value logging support across all flows
  - [x] 1.1 Write 4 focused tests for zero value logging
    - Test zero value is accepted in LogEntryModal numeric input
    - Test zero value works with quick-add chips
    - Test zero value works with backdating functionality
    - Test zero values display correctly in period totals (e.g., "0 / 1000")
  - [x] 1.2 Verify validation accepts zero values in LogEntryModal
    - Confirm `numValue >= 0` validation allows zero
    - Verify negative values are rejected with clear error message
    - Test validation in all numeric input fields
  - [x] 1.3 Verify schema validation accepts zero values
    - Confirm `activityLogSchema` in `packages/shared-model/src/schemas.ts` uses `z.number().min(0)`
    - Verify zero values save successfully to Firestore
    - Test zero values don't cause status calculation issues
  - [x] 1.4 Verify zero values in period totals and status calculations
    - Test period totals display zero correctly (e.g., "0 / 1000")
    - Verify zero values don't break status derivation (Met/In Progress/Missed)
    - Test edge case: all logs are zero for a period
  - [x] 1.5 Run only the tests written in 1.1

**Acceptance Criteria:**
- The 4 tests written in 1.1 pass
- Zero values are accepted and saved successfully in all logging flows
- Zero values display correctly in period totals
- Status calculations handle zero values correctly

#### Task Group 2: Period label unambiguity audit
**Dependencies:** None

- [x] 2.0 Ensure period labels are unambiguous across all screens
  - [x] 2.1 Write 3 focused tests for period label display
    - Test dashboard cards show computed period labels (not "Current period")
    - Test Standard Detail screen shows period label in summary
    - Test Period Logs Modal displays period label prominently
  - [x] 2.2 Audit all screens for generic period labels
    - Review `ActiveStandardsDashboardScreen.tsx` for period label usage
    - Review `StandardDetailScreen.tsx` for period label display
    - Review `PeriodLogsModal.tsx` for period label in header
    - Review `PeriodHistoryList.tsx` for period labels in history rows
  - [x] 2.3 Replace generic labels with computed date ranges
    - Ensure all screens use `calculatePeriodWindow` from `packages/shared-model/src/period-calculator.ts`
    - Replace any "Current period" fallbacks with actual computed labels
    - Verify period labels use date range format (e.g., "Dec 9, 2024 - Dec 15, 2024")
  - [x] 2.4 Run only the tests written in 2.1

**Acceptance Criteria:**
- The 3 tests written in 2.1 pass
- All screens display computed period labels with date ranges
- No generic "Current period" fallbacks remain
- Period labels are consistent across all screens

#### Task Group 3: Neutral copy audit
**Dependencies:** None

- [x] 3.0 Audit and update user-facing copy for neutrality
  - [x] 3.1 Write 2 focused tests for copy neutrality
    - Test status labels remain factual ("Met", "In Progress", "Missed")
    - Test no judgmental language appears in user-facing text
  - [x] 3.2 Review all user-facing text for judgmental language
    - Audit all screen components for motivational or judgmental phrases
    - Check for gamification language (e.g., "Great job!", "You're behind")
    - Verify status labels remain neutral and factual
  - [x] 3.3 Update any non-neutral copy found
    - Replace judgmental language with factual alternatives
    - Ensure all copy aligns with "baseline focus" principle
    - Keep success messages factual (e.g., "Log submitted" not "Great job!")
  - [x] 3.4 Run only the tests written in 3.1

**Acceptance Criteria:**
- The 2 tests written in 3.1 pass
- All user-facing copy is neutral and factual
- No judgmental or motivational language remains
- Status labels remain factual

### Error Handling Infrastructure

#### Task Group 4: Normalized error classes
**Dependencies:** None

- [x] 4.0 Create normalized error classes and utilities
  - [x] 4.1 Write 4 focused tests for normalized error classes
    - Test `AuthError` wraps Firebase Auth errors with stable code
    - Test `FirestoreError` wraps Firestore errors with stable code
    - Test error classes include user-friendly message property
    - Test centralized error message utility maps Firebase codes to user messages
  - [x] 4.2 Create `AuthError` class
    - Wrap Firebase Auth SDK errors
    - Include stable `code` property for analytics and retry logic
    - Include user-friendly `message` property
    - Follow pattern from `agent-os/standards/global/error-handling.md`
  - [x] 4.3 Create `FirestoreError` class
    - Wrap Firestore SDK errors
    - Include stable `code` property for analytics and retry logic
    - Include user-friendly `message` property
    - Handle common Firestore error codes (permission-denied, unavailable, etc.)
  - [x] 4.4 Create centralized error message utility
    - Map Firebase error codes to user-friendly messages
    - Centralize error message strings for consistency and future localization
    - Provide function to convert Firebase errors to normalized error classes
  - [x] 4.5 Run only the tests written in 4.1

**Acceptance Criteria:**
- The 4 tests written in 4.1 pass
- `AuthError` and `FirestoreError` classes wrap Firebase SDK errors correctly
- Error classes have stable codes and user-friendly messages
- Centralized error message utility maps codes to messages consistently

#### Task Group 5: Retry logic with exponential backoff
**Dependencies:** Task Group 4

- [x] 5.0 Implement retry logic with exponential backoff
  - [x] 5.1 Write 3 focused tests for retry logic
    - Test exponential backoff delays increase correctly
    - Test retry works for idempotent Firestore operations
    - Test retry fails gracefully after max attempts
  - [x] 5.2 Create retry utility function
    - Implement exponential backoff algorithm
    - Support configurable max retry attempts
    - Only retry idempotent operations (reads, writes)
    - Return normalized error on failure
  - [ ] 5.3 Integrate retry logic into error handlers ⚠️
    - Update hooks to use retry utility for transient errors
    - Apply retry to Firestore read/write operations
    - Ensure retry doesn't block UI thread
    - NOTE: Retry utility exists but not integrated into useStandards hook
  - [x] 5.4 Run only the tests written in 5.1

**Acceptance Criteria:**
- The 3 tests written in 5.1 pass
- Exponential backoff delays increase correctly
- Retry logic works for idempotent operations only
- Retry fails gracefully after max attempts

### Error Boundaries & UI Updates

#### Task Group 6: React Error Boundaries and Crashlytics
**Dependencies:** Task Group 4

- [x] 6.0 Implement React Error Boundaries with Crashlytics logging
  - [x] 6.1 Write 3 focused tests for error boundaries
    - Test Error Boundary catches unhandled exceptions
    - Test Crashlytics logging includes Firebase auth UID
    - Test Error Boundary displays user-friendly error message
  - [x] 6.2 Create React Error Boundary component
    - Catch unhandled exceptions at screen boundaries
    - Display user-friendly error message to users
    - Log fatal errors to Crashlytics with structured information
    - Include Firebase auth UID in Crashlytics user identifiers (if allowed)
  - [ ] 6.3 Integrate Error Boundary into app structure ⚠️
    - Wrap screen components with Error Boundary
    - Ensure Crashlytics logging doesn't block UI
    - Handle error recovery (retry or navigation)
    - NOTE: ErrorBoundary component exists but not integrated into App.tsx
  - [x] 6.4 Set up Crashlytics integration
    - Configure Crashlytics SDK (if not already configured)
    - Ensure fatal errors are logged with error code, context, user action
    - Test Crashlytics logging in development environment
  - [x] 6.5 Run only the tests written in 6.1

**Acceptance Criteria:**
- The 3 tests written in 6.1 pass
- Error Boundary catches unhandled exceptions
- Fatal errors are logged to Crashlytics with auth UID
- Error Boundary displays user-friendly messages

#### Task Group 7: Error banners with retry buttons
**Dependencies:** Task Groups 4, 5

- [x] 7.0 Add error banners with retry to all screens
  - [x] 7.1 Write 3 focused tests for error banners
    - Test error banner displays for transient errors
    - Test retry button triggers retry with exponential backoff
    - Test error banner clears after successful retry
  - [x] 7.2 Create reusable ErrorBanner component
    - Display error message in consistent banner style
    - Include retry button for transient errors
    - Match styling from `ActiveStandardsDashboardScreen.tsx` error banner
    - Support dark mode theming
  - [ ] 7.3 Add error banners to screens missing them ⚠️
    - Review all screens for error handling
    - Add ErrorBanner component to screens without error display
    - Ensure retry buttons use retry logic from Task Group 5
    - Handle permission-denied errors as UX cues (prompt login)
    - NOTE: ErrorBanner component exists but not consistently used. Some screens have inline error banners, others have basic error display or none
  - [x] 7.4 Ensure error cleanup on unmount
    - Cancel subscriptions/listeners on component unmount
    - Cancel React Query observers during navigation
    - Clear error messages when user actions resolve issues
  - [x] 7.5 Run only the tests written in 7.1

**Acceptance Criteria:**
- The 3 tests written in 7.1 pass
- All screens display error banners consistently
- Retry buttons trigger retry with exponential backoff
- Error banners clear after successful retry or user action

### Offline Detection

#### Task Group 8: Offline detection and sync status
**Dependencies:** None

- [x] 8.0 Implement offline detection and sync status banners
  - [x] 8.1 Write 3 focused tests for offline detection
    - Test NetInfo detects offline state correctly
    - Test sync status banner displays when offline
    - Test sync status banner clears when online
  - [x] 8.2 Install and configure NetInfo
    - Add `@react-native-community/netinfo` dependency (if not already installed)
    - Set up NetInfo listener for network state changes
    - Handle network state transitions
  - [x] 8.3 Create SyncStatusBanner component
    - Display sync status when offline
    - Show sync in progress indicator when syncing
    - Match styling from error banners for consistency
    - Support dark mode theming
  - [ ] 8.4 Integrate sync status banners into app ⚠️
    - Add SyncStatusBanner to main app layout or screens
    - Rely on Firestore offline persistence for queuing (no custom logic needed)
    - Show banner when offline or syncing
    - Clear banner when online and synced
    - NOTE: SyncStatusBanner component exists but not integrated into App.tsx
  - [x] 8.5 Run only the tests written in 8.1

**Acceptance Criteria:**
- The 3 tests written in 8.1 pass
- NetInfo detects offline state correctly
- Sync status banners display appropriately
- Firestore offline persistence handles queuing automatically

### Feature QA & Gap Testing

#### Task Group 9: Integrated workflow validation
**Dependencies:** Task Groups 1-8

- [x] 9.0 Validate end-to-end error handling and UX improvements
  - [x] 9.1 Review tests from groups 1-8 and list remaining gaps
    - Review zero value verification, period labels, copy audit, error handling, offline detection
  - [x] 9.2 Add up to 6 additional integration tests
    - Test zero value logging → period total display → status calculation
    - Test error occurs → error banner displays → retry succeeds → banner clears
    - Test offline state → sync banner displays → online → sync completes → banner clears
    - Test period label consistency across dashboard → detail → logs modal
    - Test fatal error → Error Boundary catches → Crashlytics logs → user sees message
    - Test copy neutrality across all screens and user flows
  - [ ] 9.3 Run feature-specific test suites
    - Run tests from 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.2
    - Expected total: approximately 30-36 tests maximum
    - Verify critical workflows pass
  - [ ] 9.4 File/flag any blocking defects before handing off for review

**Acceptance Criteria:**
- Feature-specific tests pass (approximately 30-36 executions total)
- Zero value logging, period labels, copy neutrality, and error handling work correctly
- Error recovery, offline detection, and Crashlytics logging function as expected
- Documented gaps (if any) have follow-up tickets

## Execution Order

1. Verification & Audit (Task Groups 1-3) - can run in parallel
2. Error Handling Infrastructure (Task Groups 4-5) - Task Group 5 depends on Task Group 4
3. Error Boundaries & UI Updates (Task Groups 6-7) - Task Group 6 depends on Task Group 4, Task Group 7 depends on Task Groups 4-5
4. Offline Detection (Task Group 8) - can run in parallel with other groups
5. Feature QA & Gap Testing (Task Group 9) - depends on all previous groups
