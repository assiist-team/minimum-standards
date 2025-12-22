# Plan: Activity History (every period) + deprecate Standards History surface

## Context
Today we have a “Standards History” experience that is effectively the `StandardDetailScreen`:
- It derives period rows from `activityLogs` for a single `standardId` (`useStandardHistory` → `computeStandardHistory`).
- It only includes periods that have logs and stops at the first gap.
- It uses the current `Standard` parameters to interpret history, which becomes ambiguous once standards are editable.

We now have a core concept of **Activities** (with a stable unit), and the product goal is to show progress **for an activity over time**, even when the activity is reused across multiple standards.

## Decision summary (locked-in)
- **Primary history surface**: Activity History only (no user-facing Standards History screen).
- **Every period**: Activity History must show every standard period, including zero-log periods.
- **Discoverability**: Add a **“View History”** button on **Activity cards** (Activity Library), styled like existing primary card buttons (e.g., “Log”).
- **Standard taps**: Tapping a standard card should be a **no-op** (no navigation to Standard Detail).
- **Current period**: Activity History includes the **current in-progress** period row(s).
- **Inactive standards**: Activity History includes history rows generated while standards were active, even if those standards are now inactive.
- **Auto-generation scope**: Period record generation **must not depend on the Dashboard being open**; implement a global engine/hook mounted for signed-in users.
- **Engine mount (best practice)**: Mount the engine **once** at the signed-in app root (e.g., alongside `MainTabs` / the tab navigator) to ensure it runs for the whole session and avoids duplicate timers from multiple screens.
- **No backfill**: No migration/backfill required because there is no live data.
- **Deactivation semantics**: Option A — when a standard becomes inactive, we **stop generating** new period rows; we do not create any special “final partial period” record.
- **Naming**: Use Firestore subcollection name `activityHistory`.
- **Archive vs inactive**: Prefer “inactive” language in UI going forward; full system-wide field rename can be deferred if risky.

## Goals / Acceptance Criteria
- Users can open an Activity and see a list of period rows **most-recent-first**.
- Rows are generated for **every completed period** of **active standards**.
- Activity History shows period rows across **all standards** that reference the same `activityId`.
- Rows remain **truthful after standard edits**, by capturing the parameters that applied at the time.
- Battery/perf: no polling loops; schedule work only at **cadence boundaries** and on **app resume**.

## Non-goals
- Summary stats, charts, or aggregations beyond what is needed to render each period row.
- Backfill for historical periods.
- Renaming the underlying data model from `archived` to `inactive` (UI text updates are ok, but schema rename is future work).

---

## Data model

### New collection
Per-user Firestore subcollection:
- `users/{userId}/activityHistory`

Each document represents **one standard period** (a “period row”) for a given `activityId` and `standardId`.

### Document ID (idempotent)
Use a deterministic ID to avoid duplicates and allow safe retries:
- `activityId__standardId__periodStartMs`

### Required fields
**Identity**
- `activityId: string`
- `standardId: string`
- `periodStartMs: number`
- `periodEndMs: number`
- `periodLabel: string`
- `periodKey: string` (if available from the period window helper; otherwise optional)

**Commitment snapshot (truthfulness across edits)**
- `standardSnapshot: {`
  - `minimum: number`
  - `unit: string`
  - `cadence: { interval: number; unit: 'day' | 'week' | 'month' }` (match shared-model shape)
  - `sessionConfig: { sessionsPerCadence: number; volumePerSession: number; sessionLabel: string }`
  - `summary?: string` (optional convenience if already computed)
`}`

**Computed rollup (enough to render a period card)**
- `total: number`
- `currentSessions: number`
- `targetSessions: number`
- `status: 'Met' | 'In Progress' | 'Missed'`
- `progressPercent: number`

**Metadata**
- `generatedAtMs: number`
- `source: 'boundary' | 'resume'`

### Indexes
We will need efficient reads for:
- Activity History screen: `where activityId == X orderBy periodEndMs desc`
- Generator catch-up: `where standardId == X orderBy periodStartMs desc limit 1`

Add composite indexes as needed (Firestore will usually prompt once).

---

## Period record generation (“Activity History engine”)

### Where it runs
Implement a global, signed-in hook (or service) mounted once for the app, not tied to a specific screen.

Examples of acceptable mounting points:
- A top-level provider component used in the authenticated app shell (`MainTabs` or equivalent).

Best-practice note:
- The engine should be a **singleton** in the signed-in tree (mounted once), so it can safely schedule boundary timers and do catch-up without risk of duplicate writes.

### When it runs
The engine runs at these moments:
- **On mount** (signed-in): compute “now” and do a catch-up pass.
- **On app resume**: do a catch-up pass (handles missed boundaries).
- **On cadence boundary**: schedule exactly one timer to the earliest next boundary across all *active* standards, then run catch-up.

No `setInterval` polling.

### Active-only rule (hard requirement)
Only standards with `standard.state === 'active'` participate in generation.
- If a standard becomes inactive, we stop generating future records for it (Option A).

### Catch-up algorithm (per standard)
For each active standard:
1. Determine `timezone` (current device timezone; use same approach as dashboard logic).
2. Determine the “latest generated period”:
   - Query `activityHistory` where `standardId == {id}` ordered by `periodStartMs desc` limit 1.
3. Choose a starting reference time:
   - If a latest period exists: start from `latest.periodEndMs + 1` (or use periodStartMs and step forward).
   - Else: start from **current period** and step backwards? (No backfill desired.)
     - Because “no backfill” is required, initial rollout can simply generate from “current period” going forward.
4. Iterate forward by period windows until we reach “current period”:
   - For each window that is **fully completed** (`window.endMs <= nowMs`), write a record.
   - Stop when window includes now (current period).

**Note on “no backfill”**:
- We intentionally do **not** create rows for periods before rollout.
- The first records will appear after the next cadence boundary (and on resumes after boundaries).

### Computing rollups per completed period
For each completed window:
- Query logs for that standard in that time range:
  - Collection: `users/{userId}/activityLogs`
  - Filter: `standardId == X` and `occurredAt` in `[startMs, endMs)`
  - Exclude soft-deleted logs (`deletedAt` present).
- Compute:
  - `total = sum(value)`
  - `currentSessions = count(logs)`
  - `targetSessions = standard.sessionConfig.sessionsPerCadence` (snapshot)
  - `status = derivePeriodStatus(total, snapshot.minimum, nowMs, endMs)` (shared-model helper)
  - `progressPercent = min(100, (total / max(minimum, 0)) * 100)` (match existing logic)
- Persist:
  - `set(docId, payload, { merge: true })` to be idempotent.

### Current in-progress period (for Activity History UI)
Because we only persist completed periods, the UI should synthesize the current period rows:
- For each **active** standard that references the activity:
  - Compute current window using `calculatePeriodWindow(nowMs, standard.cadence, timezone)`.
  - Query logs in `[startMs, nowMs)` (or `[startMs, endMs)`).
  - Compute totals/sessions and status using the same status helper (should yield `In Progress`).
  - Render as the newest rows in the list.

Implementation note:
- The Activity History screen can render:
  - `syntheticCurrentRows` (computed client-side) + `persistedRows` (from Firestore) merged and sorted by `periodEndMs desc`.
  - Deduplicate by `(standardId, periodStartMs)` so if a completed row exists for the same window, we don’t show both.

---

## UI / Navigation changes

### 1) Remove Standard Detail navigation (standard taps become no-op)
Wherever `onCardPress`/selection currently navigates to `StandardDetail`, replace with **no-op**.

Expected locations:
- Active dashboard wrapper (`onNavigateToDetail`)
- Standards Library wrapper (`onSelectStandard`)

Keep edit/deactivate actions on cards as-is.

### 2) Add Activity History screen
Add a new screen: `ActivityHistoryScreen`
- Route param: `{ activityId: string }`
- Register this route in the **Activities stack** (since it is launched from Activity Library).
- Query persisted rows:
  - `activityHistory where activityId == X orderBy periodEndMs desc`
- Compute + include current in-progress rows (see above).
- Render using `StandardProgressCard`:
  - Reuse it by constructing a `Standard`-shaped object from `standardSnapshot` (and current Standard name only for display).
  - Use `activityName` from Activities collection.
  - For rows from inactive standards, still show them; the snapshot drives correctness.

### 3) Discoverability: “View History” button on Activity cards (Activity Library)
In `ActivityLibraryScreen`, update `ActivityCard` UI to include a “View History” button:
- Styled like the existing “Log” button on standard cards (same typography + radius + colors).
- Pressing it navigates to `ActivityHistoryScreen(activityId)`.

Note: Activity Library currently treats cards as selectable only in builder context.
We will keep card tap behavior unchanged, but add a dedicated button for history in the standalone Activity tab.

---

## Archive → Inactive (language now, schema later)

### Short-term (this scope)
- UI copy: replace “Archive/Archived” wording with “Deactivate/Inactive” in visible labels/buttons where safe.
- Keep underlying fields and APIs unchanged (`archivedAtMs`, `archiveStandard`, etc.) to avoid a risky migration.

### Future work (separate spec)
System-wide rename plan:
- Data model: rename `archivedAtMs` → `inactivatedAtMs`, and `state: 'archived'` → `state: 'inactive'` (if present).
- Migrate reads/writes with backwards compatibility during rollout.
- Update tests + analytics event naming.

---

## Testing plan

### Unit tests
- Period engine:
  - Schedules next boundary correctly across multiple active standards/cadences.
  - Catch-up generates exactly N completed windows after a long pause.
  - **Active-only rule**: inactive standards do not generate rows.
  - Idempotent doc IDs prevent duplicates.

### Integration tests
- Activity History screen:
  - Renders current in-progress rows + persisted rows in correct order.
  - Uses existing status colors and progress bar behavior (via `StandardProgressCard`).

### Manual QA checklist
- Create an activity + create two standards using it.
- Log into one or both standards in a period.
- Cross a cadence boundary (or simulate clock):
  - Verify `activityHistory` docs are created for each active standard period.
- Deactivate a standard:
  - Verify new `activityHistory` docs stop for that standard after deactivation.
- Open Activity History:
  - Verify current in-progress period row(s) show and match dashboard progress totals/status.

---

## Implementation checklist (handoff-ready)
- [ ] Add `ActivityHistoryScreen` + navigation route + param type updates.
- [ ] Add global Activity History engine hook mounted for signed-in users.
- [ ] Add Firestore read/write helpers for `users/{userId}/activityHistory`.
- [ ] Add “View History” button on Activity cards (Activity Library).
- [ ] Remove StandardDetail navigation from standard taps (no-op).
- [ ] (Optional) UI text: prefer “Deactivate”/“Inactive” wording where safe.


