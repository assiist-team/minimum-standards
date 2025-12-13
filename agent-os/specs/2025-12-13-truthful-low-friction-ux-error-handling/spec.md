# Specification: Truthful, low-friction UX + error handling

## Goal
Ensure the app provides a truthful, low-friction user experience with unambiguous period displays, neutral copy, and robust error handling that follows project standards for user messaging, retries, and Crashlytics logging.

## User Stories
- As a user logging activity, I want to log zero values when appropriate so that I can maintain accurate records even when no progress was made.
- As a user viewing my progress, I want period labels to be unambiguous so that I always know which time period I'm looking at.
- As a user encountering errors, I want clear, actionable error messages with retry options so that I can recover from transient issues without frustration.

## Specific Requirements

**Zero value logging verification**
- Verify that logging "0" works in all log entry flows (LogEntryModal, quick-add chips, backdating).
- Ensure validation accepts `value >= 0` (zero is valid, negative is rejected) in all numeric input fields.
- Confirm schema validation (`activityLogSchema`) accepts zero values (should already be `z.number().min(0)`).
- Verify zero values display correctly in period totals (e.g., "0 / 1000") and don't cause status calculation issues.
- Test zero values appear normally in input fields and save successfully without special handling or warnings.

**Unambiguous period labels**
- Replace generic labels like "Current period" with computed date ranges from `calculatePeriodWindow` (e.g., "Dec 9, 2024 - Dec 15, 2024").
- Display period labels consistently across all screens (Dashboard, Standard Detail, Period Logs Modal, History).
- Ensure period labels are always visible when showing period progress or history.
- Avoid generic fallbacks when the actual period label can be computed; always compute and display the real label.

**Neutral and factual copy audit**
- Review all user-facing text for judgmental or non-neutral language (e.g., "Great job!", "You're behind", motivational messages).
- Ensure status labels ("Met", "In Progress", "Missed") remain factual and neutral.
- Keep all copy aligned with the "baseline focus" principle—factual and neutral, avoiding gamification language.

**Normalized error classes**
- Create `AuthError` and `FirestoreError` classes that wrap Firebase JS SDK errors with stable `code` properties for analytics and retry logic.
- Include user-friendly `message` property in each error class.
- Create centralized error message utility for consistency, localization, and mapping Firebase error codes to user-friendly messages.

**Error handling at screen boundaries**
- Catch errors at screen boundaries using React Error Boundaries and `QueryErrorBoundary` pattern.
- Display errors in consistent, non-intrusive banners at the top of screens (similar to ActiveStandardsDashboardScreen pattern).
- Offer manual retry buttons for transient Firestore/network issues on all screens that display errors.
- Implement exponential backoff in retry logic for idempotent operations (e.g., Firestore reads/writes).
- Interpret `permission-denied` errors as UX cues (prompt login, show "insufficient access") rather than generic errors.

**Crashlytics integration**
- Log only fatal app errors (unhandled exceptions, React Error Boundary catches) to Crashlytics with Firebase auth UID (if allowed) via Crashlytics user identifiers.
- Include structured error information (error code, context, user action) to Crashlytics for production debugging.
- Ensure Crashlytics logging doesn't block UI or slow down error recovery flows.

**Offline detection and sync status**
- Use `NetInfo` to detect offline state and show sync status banners.
- Rely on Firestore's built-in offline persistence to handle queuing user actions locally.
- Surface banners to inform users of sync status when offline or when sync is in progress.

**Error cleanup and lifecycle**
- Ensure all error handling includes proper cleanup (abort subscriptions/listeners on unmount, cancel React Query observers during navigation).
- Clear error messages automatically when user actions resolve the issue (e.g., successful retry, valid input).
- Prevent error messages from blocking core functionality—allow users to continue using the app when possible.

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**`apps/mobile/src/components/LogEntryModal.tsx`**
- Already supports zero value validation (`numValue >= 0` check).
- Has error display pattern with `saveError` state and inline error messages.
- Can be extended to verify zero values work correctly in all scenarios (quick-add chips, backdating).

**`apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx`**
- Demonstrates error banner pattern with retry button that can be replicated across all screens.
- Shows period label display pattern in dashboard cards.
- Provides example of error handling at screen boundary.

**`apps/mobile/src/screens/StandardDetailScreen.tsx`**
- Shows period label display in current period summary.
- Has error handling with retry functionality.
- Demonstrates period history display with labels that should be verified for unambiguity.

**`packages/shared-model/src/period-calculator.ts`**
- Provides `calculatePeriodWindow` function that generates period labels with date ranges.
- Should be used consistently across all screens to ensure period labels are never ambiguous.

**`agent-os/standards/global/error-handling.md`**
- Defines project standards for error handling, retries, Crashlytics logging, and user messaging.
- Should be followed exactly when implementing normalized error classes and error handling improvements.

## Out of Scope
- Reviewing error messages for neutrality (per requirements discussion).
- Reviewing validation messages for neutrality (per requirements discussion).
- Reviewing empty states for neutrality (per requirements discussion).
- Logging non-fatal errors to Crashlytics (only fatal errors per project standards).
- Automatic retry without user interaction (manual retry buttons only).
- Custom offline queuing logic (relying on Firestore's built-in persistence).
- Adding new error types beyond Firebase Auth and Firestore errors.
- Implementing Sentry integration (Crashlytics only per project standards).
- Changing period calculation logic (only ensuring labels are unambiguous in display).
- Adding new validation rules beyond ensuring zero values are supported.
