## Error handling best practices (React Native + Firebase)

> These patterns reference the services in `profiles/react-firebase/standards/global/tech-stack.md` (currently Firebase Auth, Firestore, Storage, Functions, Crashlytics). Update that file first before swapping services so error flows stay aligned.

- **User-friendly messages**: Surface actionable copy (e.g., “Check your connection and retry”) and hide Firebase error codes from end-users. Centralize strings so localization stays consistent.
- **Normalized errors**: Wrap Firebase JS SDK errors in domain-specific classes (`AuthError`, `FirestoreError`) with stable `code`s for analytics and retry logic.
- **Frontend boundaries**: Catch errors at screen boundaries (React Error Boundaries + `QueryErrorBoundary`). Offer retry buttons for transient Firestore/network issues.
- **Crash reporting**: log fatal app errors to Crashlytics and optionally Sentry. Include the Firebase auth UID (if allowed) via Crashlytics user identifiers.
- **Cloud Functions**: Throw `HttpsError` with precise status codes (`invalid-argument`, `permission-denied`). Never leak stack traces in responses; rely on Cloud Logging for details.
- **Retry/backoff**: Use exponential backoff for idempotent writes (e.g., Firestore retries). Avoid automatic retries on non-idempotent operations.
- **Security rules errors**: Interpret `permission-denied` as a UX cue (e.g., prompt login, show “insufficient access”). Do not blanket-catch and ignore.
- **Network offline mode**: Detect offline state via `NetInfo` and queue user actions locally when feasible; surface banners indicating sync status.
- **Cleanup**: Abort subscriptions/listeners on unmount, cancel React Query observers during navigation, and ensure Cloud Functions release any held resources in `finally`.
