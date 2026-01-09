# Activity History Old Log Edit Plan

## Context
- Editing a historical activity log (via `updateLogEntry` in `useStandards`) updates the `activityLogs` document but **the Activity History UI never updates**:
  - The persisted `activityHistory` rollup for that period never recomputes, so the row permanently keeps its old total/status. Example: `SiEEv8F5n0Da9OES782c__rVg8h3suMAZEhpPOg4tP__1767002400000` stayed “missed” indefinitely after multiple edits—no server-side change ever landed.
  - Even once we add a recompute path, `useActivityRangeLogs` will continue to serve cached slices until its TTL expires unless we explicitly invalidate them.
- Result: users fix an old log, but Activity History still shows the period as missed or under-counted forever; there is no automatic recovery.

## Goal
- When a user edits/deletes/restores any log (old or current), **only the affected period(s)** should recompute and the Activity History screen should re-render with the updated totals immediately, without kicking off a full backfill.

## Constraints & Guardrails
- Keep this scoped: no global recomputation, no schema changes, no heavy background jobs.
- Avoid UX regressions: do not slow down log edits noticeably; keep updates under ~300 ms by reusing local data and existing Firestore helpers.
- Maintain current caching behavior for range queries except when we *know* a mutation touched their window.

## Root Causes
1. **Persisted rollups never re-run for historical edits**. `useActivityHistoryEngine` only writes new periods as they complete; it is unaware of subsequent log mutations, so the Activity History doc simply never updates (the primary failure confirmed by the example above).
2. **Client cache layer can mask fresh data**. `useActivityRangeLogs` caches by `[user, standards[], start, end]` for 5 minutes and doesn’t have any invalidation hook tied to log edits. After we make recomputes work, we still need a way to refresh the screen immediately instead of waiting for TTL.

## Minimal Change Plan

### 1. Emit precise “log mutated” events
- Create a tiny module `apps/mobile/src/utils/activityLogEvents.ts` that exports:
  - `type ActivityLogMutation = { standardId: string; occurredAtMs: number; type: 'create' | 'update' | 'delete' | 'restore' }`.
  - `emitActivityLogMutation(mutation)` and `subscribeToActivityLogMutations(callback)`.
- In `useStandards` (`createLogEntry`, `updateLogEntry`, `deleteLogEntry`, `restoreLogEntry`), emit the event **after** the Firestore write resolves so we only fan out confirmed mutations.
- This gives every consumer (screens/hooks) a cheap way to know “a specific standard/time changed” without prop drilling or global stores.

### 2. Targeted cache bust for `useActivityRangeLogs`
- Import the subscriber into `useActivityRangeLogs`.
- When a mutation arrives:
  - Check if the `standardId` is inside the hook’s `standardIds` argument and whether `occurredAtMs` intersects `[startMs, endMs)`.
  - If so, delete that cache key (if present) and immediately flip `setShouldUseListeners(true)` so the hook reattaches live Firestore listeners and pulls the fresh data for that range.
- This keeps the TTL optimization for all other queries, but guarantees the Activity History screen re-fetches when a relevant log edit happened.

### 3. Recompute only the affected period row
- Extract a reusable helper (e.g., `apps/mobile/src/utils/activityHistoryRecompute.ts`) that can:
  1. `calculatePeriodWindow(occurredAtMs, standard.cadence, timezone, standard.periodStartPreference)`.
  2. Query `activityLogs` for `[startMs, endMs)` (same logic already in `useActivityHistoryEngine.computeRollupsForPeriod`).
  3. Sum totals + derive status using `derivePeriodStatus`, mirroring the existing engine.
  4. Call `writeActivityHistoryPeriod` with `source: 'log-edit'`, overwriting the specific document (identified by `{activityId, standardId, periodStartMs}`).
- Inside `useStandards.updateLogEntry` (and delete/restore), after the log write succeeds:
  - Lookup the local `standard` to get cadence/unit info (already in hook state).
  - Run the helper asynchronously (no need to block the UI; we can `void recomputePromise.catch(...)` but log errors).
  - Pass the log’s `occurredAtMs` (or, for delete/restore, the last known `occurredAtMs` from the log list—see open question below).
- Because we calculate the period window from the edited log’s timestamp, we only touch that single period document.

### 4. Wiring considerations / edge cases
- **Deleted logs:** the UI currently calls `deleteLogEntry(log.id, log.standardId)` but doesn’t send `occurredAtMs`. We can extend the signature to accept it (optional, default `Date.now()`), or fetch the log once before deletion. For the plan, prefer extending the call sites to pass `occurredAtMs` so recompute knows which window to fix.
- **Restores:** same as delete; include the timestamp so the helper recomputes the right window.
- **Offline edits:** if the Firestore write fails, do not emit events or recompute. If it succeeds later, the mutation emitter will still fire once the promise resolves.
- **Activity History listener:** once `writeActivityHistoryPeriod` overwrites the doc, `useActivityHistory` automatically streams the updated row; no extra work needed on the screen.

### 5. Testing & verification
- Unit-test the new helper with mocked Firestore bindings (similar to existing `useActivityHistoryEngine` tests) to confirm totals/status math matches the engine.
- Add integration tests in `useStandards.test.ts` for `updateLogEntry` to assert it calls the recompute helper with the right inputs (mock the helper, ensure it receives `standard`, `occurredAtMs`, etc.).
- Manual checks:
  1. Edit a log in a past period → Activity History list row updates within ~1s, status flips as expected.
  2. Delete + restore a past log → totals drop/recover immediately.
  3. Ensure unrelated activities/standards do not refetch (watch network logs to confirm only one query invalidated).

## Open Questions / Follow-Ups
1. Do we need to recompute *multiple* periods when someone edits the timestamp so that the log jumps into a different window? (If yes, run the helper twice: once for the original window, once for the new window.)
2. Should we log these “log-edit recomputes” somewhere (analytics) to measure frequency?
3. Long-term: consider moving this recompute logic server-side (Cloud Function) to guarantee accuracy even if the user doesn’t open the app after editing via another surface.

## Rollout Checklist
- [ ] Implement emitter + cache invalidation.
- [ ] Add recompute helper + wire into log mutations.
- [ ] Extend delete/restore callers to pass `occurredAtMs`.
- [ ] Add unit tests.
- [ ] Manual QA using a physical device editing historical periods.

