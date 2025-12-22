# Task 02 · Build Global Activity History Engine

## Goal
Implement the singleton Activity History generation engine that automatically writes `activityHistory` documents for every completed period of active standards, independent of dashboard visibility.

## Deliverables
- A hook/service (e.g., `useActivityHistoryEngine`) mounted once at the signed-in app root (near `MainTabs`).
- Timer scheduling + lifecycle handling for mount, app resume, and cadence boundary events.
- Catch-up algorithm that iterates completed periods per active standard and writes deterministic docs.
- Integration with Firestore helpers for reads/writes (Task 03).

## Key Requirements
- Engine only considers standards with `state === 'active'` (spec “Active-only rule”).
- Deterministic document IDs: `activityId__standardId__periodStartMs`.
- No polling loop; schedule a single timer to the earliest next boundary across all active standards.
- Catch-up triggers on: engine mount, app resume, and boundary timer fire.
- Writes include snapshot of the standard parameters (`standardSnapshot`) and computed rollups.
- `source` metadata field set to `'boundary'` or `'resume'` depending on trigger.

## Implementation Steps
1. **Mounting**
   - Create the engine hook/service and mount it once inside the authenticated shell so it lives across screens.
   - Ensure cleanup on unmount to avoid dangling timers/listeners.
2. **Active Standards Feed**
   - Subscribe to standards collection scoped to the user; filter to `state === 'active'`.
   - For each standard, ensure we have the latest cadence/session configuration for snapshotting.
3. **Boundary Scheduling**
   - Reuse the cadence helper already used by dashboards to compute each standard’s next boundary (`periodEndMs`).
   - Determine the soonest upcoming boundary time; schedule a single timer. When it fires, run catch-up and reschedule.
4. **Catch-up Routine**
   - For each active standard:
     - Query latest history doc (`where standardId == {id} orderBy periodStartMs desc limit 1`).
     - Determine starting window: latest `periodEndMs`, otherwise start at current period (no backfill).
     - Iteratively step forward using window helper; for each fully completed window (`window.endMs <= nowMs`), compute rollups and write doc.
     - Stop when the window includes “now” (current period).
5. **Rollup Computation**
   - Query `activityLogs` for the window range (`occurredAt` within `[startMs, endMs)` and `standardId == {id}`), excluding soft-deleted logs.
   - Compute `total`, `currentSessions`, `targetSessions`, `status`, `progressPercent` exactly as Dashboard logic.
   - Persist via `set(docId, payload, { merge: true })` for idempotency.
6. **Resume Handling**
   - Listen to app lifecycle resume events; when triggered, run catch-up and set `source: 'resume'`.

## Testing / Acceptance
- **Unit**: 
  - Earliest-boundary scheduler chooses correct timestamp given multiple standards.
  - Catch-up generates the right number of period rows after a simulated gap.
  - Inactive standards are skipped.
- **Integration**: 
  - With fake timers, verify one timer at a time and no duplicate writes when multiple screens mount.
  - Document IDs remain stable across retries.
- **Manual QA** (paired with Task 01/03): cross a cadence boundary and confirm new history docs appear without opening the dashboard.

