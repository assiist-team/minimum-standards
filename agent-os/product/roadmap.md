# Product Roadmap

1. [x] Core data model + user scoping — Define Firestore collections and shared Zod schemas/converters for `Activity`, `Standard`, and `ActivityLog`, scoped per user via Firebase Auth and security rules, so all reads/writes are validated and isolated. `[L]` (completed 2025-12-11)
2. [x] Period + status engine — Implement a shared “period calculator” that computes daily/weekly (Monday-start)/monthly windows and labels in the device timezone and derives status (Met / In Progress / Missed) from period totals, with unit tests for boundary cases (end-of-period, timezone changes). `[M]` (completed 2025-12-12)
3. [x] Activity Library (create + reuse) — Build the Activity Library UI with search, create, and “recently used” Activities so users can reuse consistent Activities across Standards. `[M]` (completed 2025-12-11)
4. [ ] Standards builder (create/edit + archive) — Implement the two-step Standard builder (pick/create Activity → set cadence + minimum + unit) and allow archiving/unarchiving, producing a clear display rule like “1000 calls / week.” `[M]`
5. [ ] Active Standards Dashboard — Create the dashboard that lists active Standards with the current Period label, current period progress (e.g., “38 / 1000”), and status, with a one-tap Log action per Standard. `[M]`
6. [ ] Fast logging (per-standard + global) — Implement the Log screen supporting both entry points (from a Standard and global), with a big numeric input, explicit save, optional collapsed note, “When?” backdating control, and immediate UI updates after save. `[M]`
7. [ ] Speed logging enhancements — Add last-used Standard memory and a visible “Last value (N)” quick-add chip so repeat logging throughout a period stays frictionless. `[S]`
8. [ ] Standard detail + history — Build the Standard detail screen showing the current period summary plus a period history list (label, total, target, Met/Missed) and (if included in MVP) the logs list for a selected period. `[M]`
9. [ ] Edit/delete logs (explicit + auditable) — Add explicit edit and delete actions for logs (prefer `editedAt` and soft-delete via `deletedAt`) and ensure totals/status recompute deterministically and immediately everywhere. `[S]`
10. [ ] Standards Templates Library (local-only) — Implement local-only Standards templates: activate a template in one tap, create from scratch, and “save as template” when creating/editing a Standard (no sharing/import in MVP). `[M]`
11. [ ] Truthful, low-friction UX + error handling — Ensure logging “0” is supported, periods are never ambiguous in UI, copy stays neutral/factual, and error handling follows the project standards (clear user messaging, retries where safe, Crashlytics logging). `[S]`
12. [ ] End-to-end verification suite — Add automated coverage for the critical flows (create Activity → create Standard → log multiple times → backdate → status changes → history → edit/delete) using the Firebase Emulator Suite, Jest/RNTL, and a small Detox smoke pass. `[M]`

> Notes
> - Order items by technical dependencies and product architecture
> - Each item should represent an end-to-end (frontend + backend) functional and testable feature
