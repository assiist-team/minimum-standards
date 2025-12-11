# Spec Requirements: Core data model + user scoping

## Initial Description
Core data model + user scoping — Define Firestore collections and shared Zod schemas/converters for `Activity`, `Standard`, and `ActivityLog`, scoped per user via Firebase Auth and security rules, so all reads/writes are validated and isolated.

## Requirements Discussion

### First Round Questions

**Q1:** I’m assuming we’ll use a **single top-level `users/{uid}` namespace** and store all domain data under it (e.g., `users/{uid}/activities`, `users/{uid}/standards`, `users/{uid}/activityLogs`). Is that correct, or do you prefer top-level collections with `userId` fields (e.g., `activities/{id}`)?
**Answer:** Yes — assumptions are fine.

**Q2:** I’m assuming we should support **soft-deletes** (`deletedAt`) and **audit timestamps** (`createdAt`, `updatedAt`, plus `editedAt` on logs) from day one. Is that correct, or should MVP be hard-delete and minimal timestamps?
**Answer:** Yes — assumptions are fine.

**Q3:** For the shared Zod schemas + converters, I’m thinking the rule is: **every Firestore write is validated server-side** (Cloud Functions or security rules constraints) and **every read is validated at the app boundary** using the same shared Zod schema. Is that the intended contract, or do you want validation only on writes initially?
**Answer:** Yes — assumptions are fine.

**Q4:** For IDs, I’m assuming Firestore auto-IDs for `Activity`, `Standard`, and `ActivityLog`, and we never encode meaning into IDs. Is that correct, or do you want any deterministic IDs (e.g., for templates or de-duping Activities by name)?
**Answer:** Yes — assumptions are fine.

**Q5:** For multi-device support, I’m assuming we should design the data model so **concurrent writes are safe** (append-only logs; standards/activities last-write-wins) and rely on Firestore offline persistence. Any special conflict rules you already want (e.g., prevent duplicate Activity names per user)?
**Answer:** No special conflict rules mentioned; assumptions are fine.

**Q6:** Exclusions check: is anything explicitly **out of scope** for this spec (e.g., admin/backoffice, sharing between users, team accounts, multi-profile per user, migrations/backfills)?
**Answer:** No explicit exclusions mentioned.

### Existing Code to Reference

No similar existing features identified for reference.

### Follow-up Questions

None.

## Visual Assets

### Files Provided:
No visual assets provided.

## Requirements Summary

### Functional Requirements
- Define Firestore collections for `Activity`, `Standard`, and `ActivityLog`, scoped per user.
- Provide shared Zod schemas and Firestore converters for these models.
- Ensure reads/writes are validated and isolated per user (via Firebase Auth + security rules / server-side constraints).
- Support append-only logging as the default behavior (multiple logs per period).
- Include audit timestamps and soft-delete fields as part of the core model.

### Reusability Opportunities
- No existing similar features identified for reuse.

### Scope Boundaries
**In Scope:**
- User-scoped Firestore data model and collection layout
- Shared schemas/converters
- Security and isolation model for per-user data access

**Out of Scope:**
- No explicit out-of-scope items specified.

### Technical Considerations
- Use `users/{uid}`-scoped collection hierarchy for domain data.
- Use Firestore auto-IDs.
- Design for multi-device/offline + concurrency safety (append-only logs; last-write-wins for Activities/Standards).
- Validate writes server-side; validate reads at the app boundary using shared Zod schemas.
