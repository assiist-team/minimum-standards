## API standards (Cloud Functions for Firebase)

> The API guidance below depends on the backend defaults listed in `profiles/react-firebase/standards/global/tech-stack.md`. Update that file first if we move away from Cloud Functions, Express routers, or Firebase services.

- **HTTP vs callable**: Use HTTPS functions with Express routers for REST APIs and callable functions only for trusted client-server RPCs.
- **Versioning**: Prefix routes with `/v1` (or similar) so new versions can run in parallel without breaking clients.
- **Auth enforcement**: Require Firebase Auth ID tokens on every private endpoint; verify tokens server-side via `firebase-admin` middleware before hitting business logic.
- **Resource naming**: Keep paths plural and shallow (`/users/:id/devices`). Avoid nesting beyond two levels; use query params for filtering.
- **Validation**: Validate payloads with shared Zod schemas before touching Firestore; return 422 with field-level errors on invalid input.
- **Idempotency & retries**: Design POST endpoints backing Cloud Functions triggers to be idempotent so retries from Firebase or clients are safe.
- **Logging & tracing**: Use `logger` from `firebase-functions` for structured logs; include `requestId` in responses for troubleshooting.
- **Timeouts & cold starts**: Keep each handler lean (<1s typical work). Push heavy jobs to background functions or queues.
