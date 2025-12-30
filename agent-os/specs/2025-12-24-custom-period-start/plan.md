# Plan: Customizable Standard Period Start

## Context
- `packages/shared-model/src/period-calculator.ts` currently hard-codes weekly windows to start on Monday; all dashboard/history hooks rely on that assumption.
- During standard creation/edit flows (`StandardsBuilderScreen`, `standardsBuilderStore`, `useStandards`), there is no place to capture a different alignment, so every standard always shares the same cadence anchor.
- Users want per-standard control—to pick a day-of-week (e.g., Wednesday) so that every subsequent period is aligned to that choice instead of being forced to Monday.

## Goals / Acceptance Criteria
1. Every standard can optionally define how its cadence windows align:
   - Weekly and longer cadences can begin on a user-selected weekday.
   - If no preference is set, behavior stays identical to today (weekly windows start on Monday, month/day/day start as before).
2. All places that derive period windows (`calculatePeriodWindow`, `buildDashboardProgressMap`, `computeStandardHistory`, `computeSyntheticCurrentRows`, `useActivityHistoryEngine`, etc.) honor the per-standard preference.
3. Firestore stores the preference so it survives reloads, history exports, and activity-history documents.
4. Standards CRUD flows (creation, editing, library imports) expose a clear UI control for the preference and round-trip the stored value.

## Constraints
- Avoid schema-breaking changes to existing documents; new fields must be optional and default to Monday for existing standards.
- Keep the API surface as small as possible while still supporting pick-a-weekday workflows.
- Re-use Luxon-friendly primitives (weekday numbers) so timezone-specific calculations stay correct.

## Implementation Plan

### 1. Define a descriptive period alignment shape
- Add a new type (e.g., `PeriodStartPreference`) in `packages/shared-model/src/types.ts` that can represent:
  - `{ mode: 'default' }`
  - `{ mode: 'weekDay'; weekStartDay: Weekday }` where `Weekday` is `1..7` or named strings for readability.
- Update `standardSchema` (and any downstream Zod schemas) to accept the optional field (e.g., `periodStartPreference?: PeriodStartPreference`).
- Update `ActivityHistoryStandardSnapshot` so snapshots of completed periods capture the preference that generated them.
- Update `standardConverter.ts`, `FirestoreStandardData`, and Firestore helper docs to serialize/deserialze the new shape.

### 2. Teach the period calculator about the preference
- Extend `calculatePeriodWindow` to accept a fourth `options` argument containing the new preference.
- Implement helpers:
  - For `mode: 'weekDay'`, shift the reference timestamp to the most recent matching weekday before the timestamp (taking timezone into account) before slicing into whole `interval`s.
  - For backward compatibility, fallback to the current Monday/month/day logic when the preference is missing.
- Keep exports in the shared model (both TypeScript and compiled JS) consistent so both mobile and server code uses the new signature.
- Update unit tests in `packages/shared-model/__tests__/period-calculator.test.ts` to cover the weekday mode and ensure Monday behavior remains default.

### 3. Persist the preference in Firestore
- Update `useStandards` (`createStandard`/`updateStandard`) to include `periodStartPreference` in their payloads and to surface it through the hooks’ API.
- Extend `Standard` in the shared model to include the preference so that `useStandards` consumers (dashboard, builder, logs) can read it.
- Ensure `standardConverter.fromFirestoreStandard` and any other conversion layer copy the field (with defaults).
- Update Firestore helper schemas (e.g., `packages/firestore-model/src/activity-history-helpers.ts`) so history writes include the preference and reads validate it.
- No migration is needed because the new field is optional; but document in the plan that missing preferences default to Monday/weekstart.

### 4. Capture the preference in builder/editor flows
- Extend `standardsBuilderStore` to track the current preference (`periodStartPreference` state) alongside cadence and goal fields.
- Update `generatePayload` to spill the preference into the output so saving a standard writes the data.
- In `StandardsBuilderScreen`, move the “Period alignment” controls into Step 2 (the period cadence container) so they surface immediately whenever a non-daily cadence is chosen.
- At the bottom of the period container, show a “Start on a specific weekday” segmented control that only appears when the cadence is weekly, monthly, or otherwise longer than daily. Use two-letter weekday labels (Mo, Tu, We, Th, Fr, Sa, Su) so all seven buttons fit on one line.
- When editing, prefill the weekday picker from the existing standard’s `periodStartPreference`.
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
  - Extend `period-calculator.test.ts` to cover weekday mode for weekly/monthly cadences.
  - Update `apps/mobile/src/utils/__tests__/dashboardProgress.test.ts` and `standardHistory.test.ts` to mock standards with weekday preferences and assert the period windows shift.
  - Adjust `apps/mobile/src/hooks/__tests__/useActiveStandardsDashboard.periodAdvance.test.ts` to ensure the scheduler still finds the correct boundary when weeks start mid-week.
- **Integration/Smoke**:
  - Add a test (or manual QA plan) that creates a weekly standard aligned to a non-Monday weekday, logs entries, and verifies the dashboard/table view uses that rotated range.
  - Confirm the activity history engine writes documents at the recalculated boundaries.
  - Validate editing a standard (prefill) and changing the weekday updates the stored preference.
- **Manual QA**:
  - Default Monday behavior remains for older standards.
  - Weekday selection shifts the window boundary in the dashboard and detail screens.

## Rollout & Observability
- Emit a debug log when a period window is calculated with a non-default preference, to help QA track new behavior (`trackStandardEvent` or console log from `calculatePeriodWindow`).
- Document the new weekday preference in the mobile help docs or onboarding so users understand it redefines “current period.”
- No special migration is required; absence of the field keeps default Monday start.

## Open Questions
1. Should the weekday selector explicitly surface a “Default (Monday)” option, or is the absence of any selection enough to signal default behavior?
2. Do any existing cadences other than weekly/monthly benefit from a weekday alignment, or should the control only appear for those two cadences?

