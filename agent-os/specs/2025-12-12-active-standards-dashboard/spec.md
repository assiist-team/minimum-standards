# Specification: Active Standards Dashboard

## Goal
Deliver a React Native dashboard that keeps performance-minded users focused on their active standards by surfacing current-period progress, status, and a one-tap logging entry point in a compact, two-line card layout.

## User Stories
- As a standards-driven user, I want my pinned standards to stay at the top so that the most critical commitments are always within thumb reach.
- As a user checking progress mid-period, I want to see each standard’s current-period label, total, target, and status at a glance so I instantly know whether I’m on track.
- As a user ready to record work, I want to tap Log from the dashboard and land in the logging modal preloaded with that standard so there’s zero navigation friction.

## Specific Requirements

**Active standards data source**
- Reuse `useStandards` to subscribe to `users/{uid}/standards`, filtering to `state === 'active'` and `deletedAt == null`.
- When the hook reports `loading`, display a skeleton list sized for at least three cards.
- Treat Firestore errors as blocking: show an inline error banner with retry that re-triggers the subscription.
- Ensure list virtualization via `FlatList` (or FlashList) with stable `keyExtractor={standard.id}` for scalability.

**Pinning and sorting model**
- Persist per-user pin order in a lightweight doc (e.g., `users/{uid}/preferences/dashboardPins`) storing an ordered array of standard IDs.
- When rendering, place pinned standards first in the saved order, then append remaining active standards sorted by `updatedAtMs` desc.
- Support manual reorder via drag handle/long-press; optimistic updates should update local order immediately and sync to Firestore.
- If a pinned standard is archived/deleted, automatically drop it from the pin list.

**Standard card layout**
- Card height should fit two text lines plus the progress bar: line 1 shows Activity name and a right-aligned status pill; line 2 shows `Period label · current / target unit`.
- Apply spacing tokens consistent with `ArchivedStandardsScreen` (16px padding, 12px gap) but slimmer vertical padding (e.g., 10–12px) to maximize density.
- Cards expand to full width with rounded corners; tapping anywhere other than Log opens a detail sheet when built later (stub handler now).
- Support multi-line truncation (lineClamp=1) on Activity names to avoid overflow; ellipsize tail.

**Progress indicator & status semantics**
- Render a thin (4px) horizontal progress bar under the two lines; fill percentage = `min(current/target, 1)`, use status color tokens (Met = success, In Progress = warning, Missed = critical) sourced from design system.
- Compute period label and boundaries via `calculatePeriodWindow` from `packages/shared-model/src/period-calculator.ts`, using device timezone from RN `Intl`.
- Period totals should rely on existing log aggregation: sum logs within the computed window and format numbers with `Intl.NumberFormat`.
- Status text comes from `derivePeriodStatus`, and the status pill mirrors the color + text for accessibility.

**Log action affordance**
- Each card exposes a primary `Log` button on the right (icon button or pill) with 44px touch target and `accessibilityRole="button"`.
- Tapping Log deep links to the fast logging modal, passing `standardId` so the modal auto-selects the standard and focuses the numeric input.
- After a successful log, automatically refresh the dashboard state via the Firestore listener (no manual refetch) and flash a brief confirmation toast.
- Emit analytics (`trackStandardEvent`) with event `dashboard_log_tap` including `standardId`, `activityId`, and whether the standard was pinned.

**Empty, loading, and error states**
- Empty state copy: “No active standards yet” with a secondary button to launch Standards Builder.
- Loading: shimmer or skeleton bars sized to two lines and a progress bar, matching final layout proportions.
- Error: show retry inline with details from the caught Error message (fallback to “Something went wrong”) and a Retry button that re-subscribes.

**Accessibility, theming, and QA**
- Ensure WCAG AA contrast for status pills and progress bars; include text status for color-blind support.
- Cards, Log buttons, and pin handles must expose descriptive `accessibilityLabel` strings (e.g., “Log progress for 1000 Calls weekly”).
- Support light/dark themes by pulling colors from theme tokens (no hard-coded hex except fallbacks for unthemed tokens).
- Add Jest/RNTL coverage for: pin ordering reducer, card rendering with each status, and Log button navigation.

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**apps/mobile/src/hooks/useStandards.ts**
- Provides active/archived filtering, `createLogEntry`, and `trackStandardEvent` usage patterns.
- Already sorts by `updatedAtMs`; extend this logic to respect pin metadata before fallback sorting.

**packages/shared-model/src/period-calculator.ts**
- Supplies `calculatePeriodWindow` and `derivePeriodStatus` for consistent period boundaries and statuses.
- Guarantees weekly periods start on Monday and handles timezone awareness—critical for accurate labels.

**apps/mobile/src/utils/standardConverter.ts**
- Formats Firestore standard payloads and exposes helpers like `formatStandardSummary` to keep cadence/unit strings consistent on cards.

**apps/mobile/src/screens/ArchivedStandardsScreen.tsx**
- Demonstrates card scaffolding, typography, spacing, and empty/error states that match the product style; reuse these StyleSheet tokens where possible.

**apps/mobile/src/utils/analytics.ts**
- Centralizes analytics helpers (`trackStandardEvent`); extend with `dashboard_log_tap` and pin interaction events for observability.

## Out of Scope
- Displaying archived standards or history charts on the dashboard.
- Inline logging or numeric keypad sheets within the dashboard card.
- Editing or archiving standards directly from the dashboard UI.
- Showing streaks, projections, or last-log timestamps on cards.
- Surfacing templates, recommendations, or insights beyond current-period progress.
