# Spec Requirements: Active Standards Dashboard

## Initial Description
Create the dashboard that lists active Standards with the current period label, current period progress (e.g., "38 / 1000"), and status, with a one-tap Log action per Standard.

## Requirements Discussion

### First Round Questions

**Q1:** I assume the dashboard shows only active (non-archived) standards sorted by either current-period urgency or most recently updated; is that correct, or should we support manual pinning/reordering?
**Answer:** Show only active standards and support manual pinning/reordering if feasible; default sorting can follow whatever approach makes sense otherwise.

**Q2:** I'm thinking each tile displays Activity name, cadence label (e.g., "Week of Dec 8"), and progress as both numbers and a horizontal progress indicator; should we keep it text-only for V1 to stay lighter?
**Answer:** Keep the horizontal progress indicator and limit the card content to two lines to conserve vertical space.

**Q3:** I assume we’ll reuse the existing status semantics and color tokens (Met/In Progress/Missed) from the period calculator outputs; is that correct, or do you want a monochrome treatment until design review?
**Answer:** Reuse the existing status semantics and color tokens.

**Q4:** For the one-tap Log action, I’m planning to deep link into the fast logging flow pre-selected to that standard; would you rather attempt an inline quick-entry (e.g., numeric keypad sheet) on the dashboard itself?
**Answer:** Deep linking into the existing logging modal works; open to other designs if there's a strong reason.

**Q5:** Should we surface any supporting context per card—like the last log timestamp or streak/projection—or keep the card scoped strictly to current-period progress for clarity?
**Answer:** Keep cards scoped to current-period progress only; no additional context needed.

**Q6:** Are there elements you explicitly want to exclude from this screen (e.g., archived standards, edit/archive actions, history charts, filters)?
**Answer:** No specific exclusions come to mind.

### Existing Code to Reference
No similar existing features identified for reference.

### Follow-up Questions
No follow-up questions were needed.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
Not applicable.

## Requirements Summary

### Functional Requirements
- Display only active standards, supporting manual pinning/reordering plus a sensible default sort.
- Each card uses two lines to show Activity name, cadence label, progress numbers, horizontal progress indicator, and status colors.
- One-tap Log action deep links into the existing logging modal preloaded with the selected standard.
- Cards focus strictly on current-period progress without extra metadata.

### Reusability Opportunities
- None identified; expect to craft UI using existing design tokens/state but no direct component references were provided.

### Scope Boundaries
**In Scope:**
- Active standards list with pinning/reordering and horizontal progress indicator.
- Status display using existing Met/In Progress/Missed colors and semantics.
- Deep link to logging modal from each card.

**Out of Scope:**
- Showing archived standards or historical context on this screen.
- Additional card context such as last log timestamps, streaks, or projections.

### Technical Considerations
- Sorting logic must prioritize pins first, then default ordering (e.g., urgency or recent activity).
- Ensure the layout constraint (two lines plus indicator) works responsively within React Native.
- Reuse status color tokens and logging modal navigation patterns already defined in the app.
