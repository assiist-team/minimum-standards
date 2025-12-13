# Specification: Standard detail + history

## Goal
Provide a Standard detail screen that shows current-period progress and a complete, audit-friendly period history (and per-period logs), so users can understand performance over time and drill into what was logged.

## User Stories
- As a standards-driven user, I want to tap a standard to see current-period progress and prior periods so that I can understand my performance over time.
- As a user reviewing a specific period, I want to view the individual logs that contributed to that period total so that I can audit entries.
- As a user maintaining my standards, I want to log, edit the standard, or archive it from the detail screen so that I can act without hunting through other screens.

## Specific Requirements

**Entry point and navigation**
- Tapping the standard card (card body) on the Active Standards Dashboard opens the Standard detail screen for that Standard.
- The in-card Log action remains a distinct tap target to open logging (no gesture conflicts with card tap).
- Update the dashboard card layout to place Log near the progress bar (not in a footer) to reduce vertical height.

**Current period summary section**
- Show the same core elements as the dashboard card: period label, current total / target summary, status (Met / In Progress / Missed), and a progress bar.
- Use the existing status semantics and color tokens.

**Period history list (all periods with logs)**
- Display a list of period rows, ordered most-recent-first, going back as far as logs exist.
- Each row shows: period label, total, target, status, and a progress indicator consistent with the dashboard.
- Totals and status must be computed deterministically using the shared period window/status logic.

**Per-period logs modal**
- Tapping a period row opens a modal showing the logs for that period.
- The modal uses a simple scrollable list and displays at minimum: value, occurred date/time, and note (if present).
- Logs shown exclude soft-deleted logs.

**Actions on detail screen**
- Provide actions for: Log (opens existing logging modal preselected to this Standard), Edit Standard, and Archive/Unarchive.
- Archive/Unarchive follows existing rules/behavior (archived standards are not loggable).

**Quick-add presets (numeric-only)**
- Logging remains numeric-only; no yes/no mode.
- If the Standard has `quickAddValues` (or default heuristic applies), the logging UI should present quick-add chips (e.g., `+1`) that fill the value input for faster entry.

**Error/empty states**
- If history is empty (no logs exist), show a minimal empty state (no charts) and still show the current period summary and Log action.
- Firestore failures should surface an actionable error message and allow retry.

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**`apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx`**
- Reuse status color tokens, progress bar styling, and the existing card layout patterns.
- Extend interaction model: card body tap navigates to detail; Log remains a separate button.

**`apps/mobile/src/utils/dashboardProgress.ts` + `packages/shared-model/src/period-calculator.ts`**
- Reuse period window calculation and status derivation to compute per-period totals and labels deterministically.
- Mirror the dashboard’s formatting (label, formatted totals, percent).

**`apps/mobile/src/hooks/useActiveStandardsDashboard.ts`**
- Reuse log subscription/query patterns (occurredAt range filtering, deletedAt filtering) as a baseline for history/log retrieval.

**`apps/mobile/src/components/LogEntryModal.tsx`**
- Reuse the logging UX and incorporate quick-add chips based on `Standard.quickAddValues`.

**`apps/mobile/src/hooks/useStandards.ts`**
- Reuse `createLogEntry`, archive/unarchive functions, and Standard creation/update patterns.

## Out of Scope
- Horizontal chronology / bar-chart timeline visualization for history.
- Charts, analytics rollups, or export.
- Editing/deleting logs from history (covered by the separate Edit/delete logs feature).
- Comparing periods side-by-side or projections/streaks.
