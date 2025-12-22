# Task 04 · Add “View History” Button on Activity Cards

## Goal
Expose Activity History via a dedicated “View History” button on Activity cards within the Activity Library, improving discoverability as mandated by the plan.

## Deliverables
- Updated `ActivityCard` component (or wrapper) that renders a primary-style button labeled “View History”.
- Button styling matches existing primary buttons on cards (same typography, radius, colors as “Log”).
- Button press navigates to `ActivityHistoryScreen` with the card’s `activityId`.
- Telemetry (if applicable) for button usage.

## Key Requirements
- Add without changing existing tap behavior on the card itself (which remains builder-specific).
- Ensure the button shows in contexts where Activity Library is surfaced to end users (not during builder multi-select if that would clutter UI—verify product expectations).
- Follows accessibility/touch-target guidelines used elsewhere (min height 44px, spacing).
- Navigation helper uses the same typed route introduced in Task 01.

## Implementation Steps
1. **Design Match**
   - Reuse existing `PrimaryCardButton` component if available; otherwise, copy tokens from the “Log” button on Standard cards.
2. **Placement**
   - Place the button in the action row of the Activity card. If cards already have actions, ensure spacing/padding matches design system.
3. **Navigation Wiring**
   - Import navigation helper (e.g., `useActivitiesNavigation`), call `navigate('ActivityHistory', { activityId })` on press.
4. **Conditional Rendering**
   - If Activity cards render in builder-only contexts, gate the button behind the same `showActions` or environment flag used for “Log”.
5. **Analytics (optional)**
   - If the Activity Library tracks button usage, emit an event such as `activity_history_view_clicked`.

## Testing / Acceptance
- Visual QA: button matches “Log” style, sits correctly on Activity cards.
- Navigation QA: pressing button opens Activity History screen (Task 01) with correct data.
- Regression: card tap behavior remains unchanged (no accidental navigation).

