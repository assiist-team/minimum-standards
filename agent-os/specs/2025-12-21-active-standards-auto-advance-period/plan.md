# Plan: Auto-advance Active Standards Dashboard period

## Context
Today, the Active Standards dashboard period label/totals/status are derived from `buildDashboardProgressMap(...)`, which defaults to `nowMs = Date.now()` at the moment the memo runs. Since the memo only re-runs when `orderedActiveStandards`, `logs`, or `timezone` change, the dashboard can continue displaying a **stale period** after a cadence boundary passes (until a new log arrives or something else forces a re-render).

Requirement: **The Active Standards screen should never show an old period**. Older periods belong on the standard detail/history screen.

## Goal / Acceptance Criteria
- Dashboard period label, totals, and status **advance automatically at the cadence boundary**, even if the user does nothing and no new logs arrive.
- If the app is backgrounded across a boundary, the dashboard **snaps to the new period immediately on resume**.
- No database/schema changes.
- Minimal battery/perf impact (no polling loops).

## Non-goals
- Implementing the standard detail/history period browsing (assumed to already exist or be planned elsewhere).
- Backfilling/persisting per-period rollups server-side.
- Notifications/reminders.

## Best-practice approach (recommended)
Drive dashboard progress recomputation with a single shared, time-based “window reference” timestamp that updates **only at cadence boundaries** (and on app resume), rather than relying on incidental re-renders.

### Why this approach
- **Deterministic**: progress for “current period” is derived from a single source of truth.
- **Efficient**: schedule one `setTimeout` to the next boundary; no interval polling.
- **Compatible**: `apps/mobile/src/utils/dashboardProgress.ts` already supports `windowReferenceMs`.
- **Testable**: boundary transitions can be validated with Jest fake timers or pure helper tests.

## Implementation Plan

### 1) Add `windowReferenceMs` state + boundary scheduling to `useActiveStandardsDashboard`
Files:
- `apps/mobile/src/hooks/useActiveStandardsDashboard.ts`

Changes:
- Add a state value:
  - `const [windowReferenceMs, setWindowReferenceMs] = useState(() => Date.now());`
- Add an effect that computes the **next boundary** across all active standards:
  - For each standard: `calculatePeriodWindow(windowReferenceMs, standard.cadence, timezone).endMs`
  - Choose the minimum `endMs` as the next boundary (earliest boundary across standards).
  - Schedule `setTimeout(() => setWindowReferenceMs(Date.now()), delayMs)`
  - Clear timeout on cleanup.
  - Use `delayMs = Math.max(0, nextBoundaryMs - Date.now())` to handle missed boundaries.
- Update `buildDashboardProgressMap` invocation to pass `windowReferenceMs`.

Notes:
- This ensures the dashboard period advances even when logs/standards do not change.
- It is OK if the Firestore log query remains broader than the current window; progress calculations already filter to the active window.

### 2) Snap forward on app resume (and indirectly handle timezone changes)
Files:
- `apps/mobile/src/hooks/useActiveStandardsDashboard.ts`

Changes:
- Subscribe to React Native `AppState`:
  - On transition to `'active'`, call `setWindowReferenceMs(Date.now())`.

Notes:
- Mobile apps can be suspended; this guarantees the dashboard never shows stale periods after resume.
- Timezone changes are hard to detect reliably without a native event; forcing a re-evaluation on resume covers the most common “timezone changed while app inactive” scenario.

### 3) Keep UI period label source consistent
Files:
- `apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx`

Changes:
- Prefer the computed `progress.periodLabel` always; only fall back to a calculated label if `progress` is null (current behavior is acceptable once the hook always recomputes on boundaries).
- (Optional hardening) Remove per-card `calculatePeriodWindow(Date.now(), ...)` fallback and instead surface a `periodLabel` from the hook even when no logs exist, to avoid any future drift.

## Testing Plan

### Unit tests (recommended)
Files:
- `apps/mobile/src/utils/__tests__/dashboardProgress.test.ts` (extend)
- (Optionally add) `apps/mobile/src/hooks/__tests__/useActiveStandardsDashboard.periodAdvance.test.ts`

Test cases:
- **Boundary advance without new logs**:
  - Use Jest fake timers and a mocked clock:
    - Set `windowReferenceMs` just before the boundary.
    - Advance timers past the computed `endMs`.
    - Assert `periodLabel` changes to the new period for at least one cadence.
- **Multiple standards, different cadences**:
  - Ensure next boundary chosen is the earliest across standards and that the scheduled tick advances the correct standard(s).
- **Resume behavior**:
  - Simulate AppState transition to `active` and assert `windowReferenceMs` (or derived period label) updates.

### Integration sanity (optional)
Files:
- `apps/mobile/src/screens/__tests__/ActiveStandardsDashboardScreen.test.tsx`

Test case:
- Render the dashboard with a mocked hook result whose `progress.periodLabel` changes after a tick, and verify the UI updates (mostly a “wiring” test).

## Rollout / Observability
- Add an analytics/debug log (optional) when the dashboard auto-advances:
  - e.g. `trackStandardEvent('dashboard_period_advance', { triggeredBy: 'timer' | 'resume' })`
- Manual QA checklist:
  - Leave app open across a daily boundary (or simulate by changing device time), confirm dashboard advances with no interaction.
  - Background app before boundary, reopen after boundary, confirm dashboard is current immediately.

## Open Questions
- Should “never show old period” mean **immediate** advancement while the app is open, or is “on next render/resume” acceptable? (This plan provides immediate advancement via a scheduled boundary tick.)
- Are there any screens besides Active Standards that reuse `useActiveStandardsDashboard` and need identical behavior? If yes, this change is a net win (shared correctness).


