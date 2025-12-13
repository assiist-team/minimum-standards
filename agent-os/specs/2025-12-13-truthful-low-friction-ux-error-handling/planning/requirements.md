# Spec Requirements: Truthful, low-friction UX + error handling

## Initial Description

Truthful, low-friction UX + error handling — Ensure logging "0" is supported, periods are never ambiguous in UI, copy stays neutral/factual, and error handling follows the project standards (clear user messaging, retries where safe, Crashlytics logging). `[S]`

## Requirements Discussion

### First Round Questions

**Q1:** I assume we verify that logging "0" works in all flows (LogEntryModal, quick-add chips, backdating) and that validation accepts zero (not just positive numbers). Should we also verify that zero values display correctly in period totals (e.g., "0 / 1000") and don't cause status calculation issues?

**Answer:** Sure, let's verify that.

**Q2:** I assume we replace generic labels like "Current period" with computed labels from `calculatePeriodWindow` (e.g., "Dec 9, 2024 - Dec 15, 2024"). Should we also include the cadence context (e.g., "Week of Dec 9, 2024") or is the date range sufficient?

**Answer:** Date range is sufficient.

**Q3:** I assume we audit all user-facing text to remove judgmental language (e.g., "Great job!", "You're behind", motivational messages) and keep it factual (e.g., "Met", "In Progress", "Missed"). Should we also review error messages, validation messages, and empty states for neutrality?

**Answer:** That's correct. I don't really care about reviewing error messages. Validation messages in empty states for neutrality, no need.

**Q4:** I assume we create `AuthError` and `FirestoreError` classes that wrap Firebase SDK errors with stable `code` properties for retry logic. Should these classes also include user-friendly message properties, or should message mapping happen separately in a centralized error message utility?

**Answer:** I don't know, read number four, just do what you think is best.

**Decision:** Create `AuthError` and `FirestoreError` classes with stable `code` properties. Include a user-friendly `message` property in each class, but also maintain a centralized error message utility for consistency, localization, and mapping Firebase error codes to user-friendly messages.

**Q5:** I assume we log fatal errors (unhandled exceptions, React Error Boundary catches) to Crashlytics with Firebase auth UID. Should we also log non-fatal but significant errors (e.g., permission-denied, network failures after retries), or only truly fatal crashes?

**Answer:** Do you think is best?

**Decision:** Log only fatal app errors (unhandled exceptions, React Error Boundary catches) to Crashlytics with Firebase auth UID. Do not log non-fatal errors to Crashlytics, as per project standards which specify "log fatal app errors to Crashlytics."

**Q6:** I assume we add retry buttons to all error banners (like the existing ones in ActiveStandardsDashboardScreen and StandardDetailScreen) for transient errors (network, Firestore timeouts). Should retries use exponential backoff automatically, or should users manually retry via the button?

**Answer:** Do what you think is best.

**Decision:** Add manual retry buttons for transient errors (network, Firestore timeouts). When users click retry, the underlying retry logic should use exponential backoff for idempotent operations (e.g., Firestore reads/writes), as per project standards.

**Q7:** I assume we use `NetInfo` to detect offline state and show sync status banners. Should we queue user actions locally when offline (Firestore offline persistence handles this), or just show a banner indicating sync status without queuing?

**Answer:** If it's easy to persist user actions locally when offline, let's do it. Peace. we can skip it.

**Decision:** Use `NetInfo` to detect offline state and show sync status banners. Rely on Firestore's built-in offline persistence to handle queuing user actions locally. Show banners to inform users of sync status.

**Q8:** Are there any specific screens, components, or error scenarios we should exclude from this work, or should we audit and improve all user-facing copy and error handling across the entire app?

**Answer:** No scope boundaries to note.

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

- Verify zero value logging works in all flows (LogEntryModal, quick-add chips, backdating)
- Verify validation accepts zero values (not just positive numbers)
- Verify zero values display correctly in period totals (e.g., "0 / 1000")
- Verify zero values don't cause status calculation issues
- Replace generic period labels like "Current period" with computed date ranges from `calculatePeriodWindow` (e.g., "Dec 9, 2024 - Dec 15, 2024")
- Audit all user-facing text to remove judgmental language and keep it factual
- Create normalized error classes (`AuthError`, `FirestoreError`) with stable `code` properties and user-friendly `message` properties
- Create centralized error message utility for consistency and localization
- Log fatal app errors (unhandled exceptions, React Error Boundary catches) to Crashlytics with Firebase auth UID
- Add manual retry buttons to all error banners for transient errors (network, Firestore timeouts)
- Implement exponential backoff in retry logic for idempotent operations
- Use `NetInfo` to detect offline state and show sync status banners
- Rely on Firestore offline persistence for queuing user actions locally

### Reusability Opportunities

- Leverage existing error banner patterns from `ActiveStandardsDashboardScreen` and `StandardDetailScreen`
- Reuse period calculator (`calculatePeriodWindow`) for consistent label generation
- Follow error handling patterns from `agent-os/standards/global/error-handling.md`
- Reference existing validation patterns for zero values

### Scope Boundaries

**In Scope:**
- Verifying zero value logging support across all flows
- Ensuring period labels are unambiguous with computed date ranges
- Auditing user-facing copy for neutrality (excluding error messages, validation messages, and empty states)
- Implementing normalized error classes (`AuthError`, `FirestoreError`)
- Adding Crashlytics logging for fatal errors
- Adding manual retry functionality with exponential backoff
- Adding offline detection and sync status banners
- Leveraging Firestore offline persistence for local queuing

**Out of Scope:**
- Reviewing error messages for neutrality
- Reviewing validation messages for neutrality
- Reviewing empty states for neutrality
- Logging non-fatal errors to Crashlytics
- Automatic retry without user interaction
- Custom offline queuing logic (relying on Firestore's built-in persistence)

### Technical Considerations

- Zero value validation already exists (`numValue >= 0`) but needs verification across all flows
- Period labels generated by `calculatePeriodWindow` should be used consistently across all screens
- Error handling standards defined in `agent-os/standards/global/error-handling.md`
- Crashlytics integration needs to be added to error handlers (React Error Boundaries)
- Normalized error classes need to be created with stable codes and user-friendly messages
- Centralized error message utility should map Firebase error codes to user-friendly messages
- Offline detection via `NetInfo` needs to be integrated
- Firestore offline persistence already handles local queuing, so sync status banners are the main UX addition
- Retry logic should use exponential backoff for idempotent operations only
