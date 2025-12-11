# Specification: Core data model + user scoping

## Goal
Establish a user-isolated Firestore data model for core domain entities and define shared Zod schemas + Firestore converters so reads/writes are consistently validated and type-safe across app and Cloud Functions.

## User Stories
- As a performance-minded user, I want my Activities, Standards, and Logs to be private to my account so that my data is isolated and secure.
- As a developer, I want shared schemas and converters for core models so that client and server validate the same shapes and reduce data bugs.
- As a developer, I want a clear Firestore structure and rule strategy so that future features can build on predictable, secure data access.

## Specific Requirements

**User-scoped collection layout**
- Use a `users/{uid}` root and place domain collections beneath it (e.g., `users/{uid}/activities`, `users/{uid}/standards`, `users/{uid}/activityLogs`)
- Use plural, lowercase collection names
- Ensure all reads/writes can be authorized by user identity without client-side filtering

**Core model definitions**
- Define canonical models for `Activity`, `Standard`, and `ActivityLog`
- Use Firestore auto-IDs (no semantic/deterministic IDs required for MVP)
- Keep IDs URL-safe and short (default Firestore IDs)

**Shared Zod schemas**
- Create shared Zod schemas for each core model
- Use schemas for client-side validation for UX and safety
- Ensure schemas are reusable by Cloud Functions for server-side validation

**Firestore typed converters**
- Provide typed Firestore converters that align with the shared Zod schemas
- Ensure timestamp fields are handled consistently (Firestore `Timestamp` ↔ app representations)
- Ensure converter usage is standard across all reads and writes for these models

**Timestamps and auditability**
- Include `createdAt` and `updatedAt` on core documents
- Prefer `serverTimestamp()`-controlled timestamps to reduce client tampering risk
- For logs, support edit audit via `editedAt`

**Soft delete strategy**
- Support soft-delete via `deletedAt` (rather than hard delete) for core entities
- Ensure soft-deleted documents are excluded from normal reads/queries
- Avoid using array fields for large/multi-writer lists; keep logs as a collection

**Security rules for user isolation**
- Ensure only the authenticated user can read/write their own scoped documents
- Mirror query constraints in rules (do not rely on client-side filtering)
- Ensure rules prevent writing invalid shapes/fields beyond the allowed schema

**Concurrency + offline safety**
- Model logs as append-mostly; avoid requiring replacement of per-period totals
- Assume multi-device + offline persistence; design for safe concurrent usage
- Use transactions/batched writes only where consistency across documents is required

**Indexes and query planning**
- Identify the initial query patterns needed for Activities/Standards/Logs
- Add required composite indexes to `firestore.indexes.json` before dependent features ship
- Prefer narrow reads with `where`/`orderBy`/`limit` for collection access

**Migration approach for future evolution**
- Treat schema changes as controlled migrations even though Firestore is schemaless
- Define an approach for idempotent backfills and safe rollouts (emulator first)
- Prefer additive changes and keep backward compatibility for at least one release cycle

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**No existing code identified**
- No reusable implementation code was found in this repository for Firestore schemas/converters; follow the standards docs for modeling, queries, migrations, and error handling.

## Out of Scope
- Team accounts, shared workspaces, or multi-user access controls
- Cross-user data sharing/import/export
- Admin/backoffice tooling
- Notifications/reminders
- Period/status calculation engine
- UI screens (Dashboard, Libraries, Builders) beyond what is necessary to validate the data model approach
