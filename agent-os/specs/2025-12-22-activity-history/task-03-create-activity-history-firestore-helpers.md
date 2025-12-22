# Task 03 · Create Activity History Firestore Helpers

## Goal
Add typed Firestore utilities for interacting with the `users/{userId}/activityHistory` subcollection, covering deterministic writes, queries for Activity History UI, and lookups needed by the engine.

## Deliverables
- Helper to build the deterministic doc ID: `activityId__standardId__periodStartMs`.
- `writeActivityHistoryPeriod` function that accepts the snapshot + rollup payload and writes via `set(..., { merge: true })`.
- Query helpers:
  - `getLatestHistoryForStandard(standardId)` ordered by `periodStartMs desc limit 1`.
  - `listenActivityHistoryForActivity(activityId, options)` ordered by `periodEndMs desc`.
- Shared typings (`ActivityHistoryDoc`, `ActivityHistorySnapshot`, etc.) colocated with other shared models.

## Key Requirements
- Fields must match the spec’s **Required fields**, **Commitment snapshot**, **Computed rollup**, and **Metadata** sections.
- Keep naming consistent with plan: collection `activityHistory`, `source` enum `'boundary' | 'resume'`.
- Ensure queries are ready for indexes noted in the plan (activity and standard lookups).
- Helpers should integrate cleanly with existing Firestore layer conventions (error handling, caching, converters).

## Implementation Steps
1. **Type Definitions**
   - Define `ActivityHistoryDoc` interface mirroring plan fields.
   - Export builder for the deterministic ID.
2. **Write Helper**
   - Accept `{ userId, activityId, standardId, window, rollup, snapshot, source }`.
   - Compose payload and call `set` with merge true.
   - Ensure timestamps are stored as `number` (ms) to match spec.
3. **Read Helpers**
   - `getLatestHistoryForStandard`: query subcollection filtered by `standardId`, ordered by `periodStartMs desc`, limited to 1 result.
   - `listenActivityHistoryForActivity`: query filtered by `activityId`, ordered by `periodEndMs desc`; return unsubscribe for screen usage.
4. **Exports & Tests**
   - Export helpers from Firestore module index for reuse in Task 01 & Task 02.
   - Add unit tests (if existing Firestore helpers have precedent) verifying ID builder and converter schema.

## Testing / Acceptance
- Unit tests for ID builder and read helpers (mock Firestore).
- Integration (with emulator or staging) to confirm writes land under `users/{userId}/activityHistory` and queries return expected ordering.

