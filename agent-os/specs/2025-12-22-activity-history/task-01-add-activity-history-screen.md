# Task 01 · Add Activity History Screen

## Goal
Create an `ActivityHistoryScreen` that surfaces every period row for a given `activityId`, merging persisted history rows with synthetic current-period rows, per the Activity History plan.

## Deliverables
- New `ActivityHistoryScreen` React component in the Activities navigation stack.
- Route + param typing updates (`{ activityId: string }`).
- Data adapter that merges synthetic current-period rows with Firestore rows, sorted by `periodEndMs desc`.
- UI built with `StandardProgressCard`, hydrated from the stored `standardSnapshot` and living Activity metadata (activity name).

## Key Requirements
- Show rows most-recent-first (spec “Goals / Acceptance Criteria”).
- Include current in-progress period rows synthesized client-side (plan “Current in-progress period”).
- Persisted rows queried via `users/{userId}/activityHistory where activityId == X orderBy periodEndMs desc`.
- Deduplicate by `(standardId, periodStartMs)` so synthetic + persisted rows don’t double-render the same window.
- Show rows from inactive standards exactly as stored (snapshot drives truthfulness).

## Implementation Steps
1. **Routing**
   - Add the screen to the Activities stack navigator (likely next to Activity Library / builder screens).
   - Expose a typed navigation helper (e.g., `navigateToActivityHistory(activityId)`).
2. **Data Fetching**
   - Firestore query for persisted rows (hook or SWR-style fetcher). Ensure pagination or lazy loading if the list grows, but initial pass can load first page ordered descending.
   - Accept `activityId` route param; guard for missing data.
3. **Synthetic Current Rows**
   - For each active standard referencing the activity, compute the current period window using the existing cadence helper (`calculatePeriodWindow`).
   - Query `activityLogs` within `[startMs, nowMs)` and compute `total`, `currentSessions`, `targetSessions`, `status` (`derivePeriodStatus`), and `progressPercent` (match Dashboard logic).
4. **Merging & Rendering**
   - Merge synthetic rows with persisted rows; sort by `periodEndMs desc`; drop duplicates via `(standardId, periodStartMs)`.
   - Map each row into the props needed by `StandardProgressCard` by reconstructing a Standard-like object from `standardSnapshot`. Use the current Activity name for display.
   - Display current in-progress rows visually consistent with completed rows, with clear labeling (e.g., “In Progress”).
5. **Empty / Loading States**
   - Loading indicator while data fetch resolves.
   - Empty state copy such as “No history yet. Period rows appear after the next cadence boundary.” (aligns with “No backfill” note).

## Testing / Acceptance
- **Unit**: data merging helper deduplicates and sorts rows correctly.
- **Integration**: screen renders current + persisted rows in order, uses `StandardProgressCard` styles, honors inactive snapshots.
- **Manual QA**: follow spec checklist — create activity, attach to standards, log sessions, cross boundary, verify UI shows persisted rows + current period row.

