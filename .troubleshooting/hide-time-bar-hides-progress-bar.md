# Issue: "Hide time bar" also hides volume progress bar in StandardProgressCard

**Status:** Resolved
**Opened:** 2026-02-11
**Resolved:** 2026-02-11

## Info
- **Symptom:** When the user toggles "hide time bar" in UI preferences, the entire progress section (including the volume progress bar and summaries) disappears from StandardProgressCard, not just the time bar.
- **Affected area:** `apps/mobile/src/components/StandardProgressCard.tsx`, `apps/mobile/src/screens/ActiveStandardsDashboardScreen.tsx`

The `showTimeBar` preference from `uiPreferencesStore` is passed as a prop to `StandardProgressCard` and used as `showTimeBarProp`. At line 391, this prop gates the **entire** `progressContainer` `<View>`, which contains both:
1. The time progress bar (lines 400-424) — should be hidden
2. The volume progress bar (lines 426-445) — should NOT be hidden

The time bar already has its own independent guard at line 400: `{shouldShowTimeBar && timeLabels && (…)}`. So `showTimeBarProp` is redundant for the time bar and destructive for the volume bar.

## Experiments

### H1: `showTimeBarProp` wraps the entire progress container instead of just the time bar
- **Rationale:** Reading the JSX at line 391, the `{showTimeBarProp && (` guard wraps lines 391-447, which is the full `progressContainer` including volume bar and summaries.
- **Experiment:** Confirm the JSX structure — does `showTimeBarProp` gate only the time elements or the whole container?
- **Result:** Confirmed. Line 391 `{showTimeBarProp && (` wraps lines 392-447, which includes the volume progress bar (lines 426-435) and the volume/session summaries (lines 436-445). The time bar already has its own guard at line 400: `{shouldShowTimeBar && timeLabels && (`.
- **Verdict:** Confirmed

## Resolution

- **Root cause:** `showTimeBarProp` wrapped the entire `progressContainer` (time bar + volume bar + summaries) instead of just the time bar elements.
- **Fix:** Moved `showTimeBarProp` guard to only wrap the time bar section (lines 399-423), leaving the volume progress bar and summaries always visible.
- **Files changed:** `apps/mobile/src/components/StandardProgressCard.tsx`
- **Lessons:** When a "hide X" preference gates a container that holds multiple sibling elements, check that the guard isn't hiding unrelated siblings.
