# Plan: Customizable Standard Period Start

## Context
- `packages/shared-model/src/period-calculator.ts` currently hard-codes weekly windows to start on Monday; all dashboard/history hooks rely on that assumption.
- During standard creation/edit flows (`StandardsBuilderScreen`, `standardsBuilderStore`, `useStandards`), there is no place to capture a different alignment, so every standard always shares the same cadence anchor.
- Users want per-standard control—to pick a day-of-week (e.g., Wednesday) or an explicit start date—so that every subsequent period is aligned to that choice instead of being forced to Monday.

## Goals / Acceptance Criteria
1. Every standard can optionally define how its cadence windows align:
   - Weekly cadences can begin on a user-selected weekday.
   - More flexible “custom start date” option is available for people who want a specific anchor moment (useful for multi-day cadences or aligning with a real-world routine).
   - If no preference is set, behavior stays identical to today (weekly windows start on Monday, month/day/day start as before).
2. All places that derive period windows (`calculatePeriodWindow`, `buildDashboardProgressMap`, `computeStandardHistory`, `computeSyntheticCurrentRows`, `useActivityHistoryEngine`, etc.) honor the per-standard preference.
3. Firestore stores the preference so it survives reloads, history exports, and activity-history documents.
4. Standards CRUD flows (creation, editing, library imports) expose a clear UI control for the preference and round-trip the stored value.

## Constraints
- Avoid schema-breaking changes to existing documents; new fields must be optional and default to Monday for existing standards.
- Keep the API surface as small as possible while still supporting both pick-a-weekday and pick-a-date workflows.
- Re-use Luxon-friendly primitives (weekday numbers or anchored timestamps) so timezone-specific calculations stay correct.

## Implementation Plan

### 1. Define a descriptive period alignment shape
- Add a new type (e.g., `PeriodStartPreference`) in `packages/shared-model/src/types.ts` that can represent:
  - `{ mode: 'default' }`
  - `{ mode: 'weekDay'; weekStartDay: Weekday }` where `Weekday` is `1..7` or named strings for readability.
  - `{ mode: 'anchorDate'; anchorMs: TimestampMs }` for fixed-date anchoring.
- Update `standardSchema` (and any downstream Zod schemas) to accept the optional field (e.g., `periodStartPreference?: PeriodStartPreference`).
- Update `ActivityHistoryStandardSnapshot` so snapshots of completed periods capture the preference that generated them.
- Update `standardConverter.ts`, `FirestoreStandardData`, and Firestore helper docs to serialize/deserialze the new shape.

### 2. Teach the period calculator about the preference
- Extend `calculatePeriodWindow` to accept a fourth `options` argument containing the new preference.
- Implement helpers:
  - For `mode: 'weekDay'`, shift the reference timestamp to the most recent matching weekday before the timestamp (taking timezone into account) before slicing into whole `interval`s.
  - For `mode: 'anchorDate'`, compute how many intervals have elapsed since `anchorMs` and derive the current window so that the anchor remains the start of the zeroth period.
  - For backward compatibility, fallback to the current Monday/month/day logic when the preference is missing.
- Keep exports in the shared model (both TypeScript and compiled JS) consistent so both mobile and server code uses the new signature.
- Update unit tests in `packages/shared-model/__tests__/period-calculator.test.ts` to cover new modes and ensure Monday behavior remains default.

### 3. Persist the preference in Firestore
- Update `useStandards` (`createStandard`/`updateStandard`) to include `periodStartPreference` in their payloads and to surface it through the hooks’ API.
- Extend `Standard` in the shared model to include the preference so that `useStandards` consumers (dashboard, builder, logs) can read it.
- Ensure `standardConverter.fromFirestoreStandard` and any other conversion layer copy the field (with defaults).
- Update Firestore helper schemas (e.g., `packages/firestore-model/src/activity-history-helpers.ts`) so history writes include the preference and reads validate it.
- No migration is needed because the new field is optional; but document in the plan that missing preferences default to Monday/weekstart.

### 4. Capture the preference in builder/editor flows
- Extend `standardsBuilderStore` to track the current preference (`periodStartPreference` state) alongside cadence and goal fields.
- Update `generatePayload` to spill the preference into the output so saving a standard writes the data.
- In `StandardsBuilderScreen`, add a “Period alignment” card below the cadence controls. Provide two toggles:
  1. “Start on a specific weekday” with a `Picker`/`SegmentedControl` for the days Monday–Sunday.
  2. “Use a custom start date” that opens a `DateTimePicker` and captures a timestamp.
- The controls should mutually exclude one another (choosing a date clears the weekday selection and vice versa) and show descriptive helper text.
- When editing, prefill these controls from the existing standard’s `periodStartPreference`.
- Decide whether the “default Monday” option should appear explicitly (e.g., a “Default (Monday)” radio button) or simply be the absence of a preference; document the UX decision in this plan.

### 5. Propagate the preference through computed views
- Anywhere `calculatePeriodWindow` is invoked, pass the standard’s preference:
  - `apps/mobile/src/utils/dashboardProgress.ts`.
  - `apps/mobile/src/utils/standardHistory.ts`.
  - `apps/mobile/src/utils/activityHistory.ts`.
  - `apps/mobile/src/hooks/useActiveStandardsDashboard.ts`.
  - `apps/mobile/src/hooks/useActivityHistoryEngine.ts`.
  - `apps/mobile/src/screens/StandardDetailScreen.tsx` (where the current period label is shown).
  - Any tests/mocks that construct periods (`apps/mobile/src/utils/__tests__/*`, `hooks` tests).
- Update log subscriptions (e.g., `computeEarliestStart` in `useActiveStandardsDashboard`) to use the preference when estimating how far back to load logs (align to the earliest possible start).
- Ensure derived labels (`window.label`) reflect the custom start so the UI text matches the new week boundaries.
- Verify `activityHistory` snapshots include the preference so exported rows can be recalculated if needed.

### 6. Testing strategy
- **Unit**:
  - Extend `period-calculator.test.ts` to cover weekday and anchorDate modes for weekly/monthly cadences.
  - Update `apps/mobile/src/utils/__tests__/dashboardProgress.test.ts` and `standardHistory.test.ts` to mock standards with preferences and assert the period windows shift.
  - Adjust `apps/mobile/src/hooks/__tests__/useActiveStandardsDashboard.periodAdvance.test.ts` to ensure the scheduler still finds the correct boundary when weeks start mid-week.
- **Integration/Smoke**:
  - Add a test (or manual QA plan) that creates a standard anchored on Wednesday, logs entries, and verifies the dashboard/table view uses the Wednesday→Tuesday range.
  - Confirm the activity history engine writes documents at the recalculated boundaries.
  - Validate editing a standard (prefill) and toggling between weekday/date updates the stored preference.
- **Manual QA**:
  - Default Monday behavior remains for older standards.
  - Weekday selection shifts the window boundary in the dashboard and detail screens.
  - Custom date start keeps consistent across sessions and after app restarts (`useActivityHistoryEngine` catch-up uses the preference).

## Rollout & Observability
- Emit a debug log when a period window is calculated with a non-default preference, to help QA track new behavior (`trackStandardEvent` or console log from `calculatePeriodWindow`).
- Document the new preference in the mobile help docs or onboarding so users understand it resets the definition of “current period.”
- No special migration is required; absence of the field keeps default Monday start.

## Open Questions
1. Should the “custom start date” option capture a full timestamp (with time of day) or just a date (and assume midnight local)? (Recommendation: store midnight local to keep boundaries crisp.)
2. Will calendars/timezones ever require a “fiscal week” offset (e.g., start on Tuesday only for some months)? If so, we might need a more flexible “anchor timestamp + unit” strategy. Document this as a follow-up if we hit limits.

