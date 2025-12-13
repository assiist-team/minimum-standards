# Spec Requirements: Standard detail + history

## Initial Description
Build the Standard detail screen showing the current period summary plus a period history list (label, total, target, Met/Missed) and (if included in MVP) the logs list for a selected period.

## Requirements Discussion

### First Round Questions

**Q1:** I assume users will access this detail screen by tapping on a standard card from the Active Standards Dashboard (rather than a separate "View Details" button); is that correct, or should we add an explicit "View Details" action on each card?
**Answer:** Tapping on the standard card is fine, but the card also has a Log button so we need to make sure the implementation is clean and the experience is intuitive with that setup. Also, you don’t love the Log button being in the card footer; you envisioned it next to the progress bar to avoid taking up too much vertical space per card.

**Q2:** I'm thinking the current period summary section should display the same information shown on the dashboard card (Activity name, period label, current total / target, status, progress bar) but in a more expanded format; should we keep it consistent with the dashboard card style, or make it more prominent/visual on the detail screen?
**Answer:** The current period summary section should display the same info shown on the dashboard card.

**Q3:** For the period history list, I assume we should show all past periods (going back as far as logs exist) sorted by most recent first, with each row showing period label, total, target, and status badge; is that correct, or should we limit to a specific number of periods (e.g., last 12 months or last 20 periods)?
**Answer:** Go back as far as logs exist; sorting by most recent first. You’re torn on whether history should be a list: you see two approaches that could work—(1) a list of progress bars per period, or (2) a horizontal visual chronology/bar-chart-style view per period where over-target bars go above the line. You’re concerned the chronology approach could create large visual gaps if there are big time gaps, though side-scrolling might mitigate that. Given concerns (especially around standards changing shape over time), this makes you think the list view is likely better for now.

**Q4:** The spec mentions "(if included in MVP) the logs list for a selected period" - I'm assuming this means users can tap a period in the history list to expand/show logs for that period; should we include this logs list feature in MVP, or defer it to a later release?
**Answer:** It would be cool to let users tap on a period to see the logs for that period—probably as a modal with a simple list that may need to be scrollable. Might as well include it in this release.

**Q5:** I'm thinking the detail screen should include actions like "Log" (deep link to logging modal), "Edit Standard" (navigate to builder), and "Archive" (if not already archived); should we include all of these, or keep the screen read-only with just a "Log" action for MVP?
**Answer:** Include all of them: Log button in the detail screen, Edit Standard, and Archive.

**Q6:** Should the period history list use the same status color tokens (Met/In Progress/Missed) as the dashboard, and should each history row be tappable to show logs (if included), or should history rows be read-only indicators?
**Answer:** Use the same status color tokens as everything else.

**Q7:** Are there elements you explicitly want to exclude from this screen (e.g., charts/graphs, export functionality, period comparison views, or editing logs directly from this screen)?
**Answer:** Nothing you want to explicitly exclude from this screen.

### Existing Code to Reference
No similar existing features identified for reference.

**Similar Features Identified:**
No similar existing features identified for reference.

### Follow-up Questions

**Follow-up 1:** Card tap vs Log button interaction: should we make the card body tappable to open the detail screen while keeping Log as a separate action?
**Answer:** Tapping the card for details is fine, but you want the Log button next to the progress bar (not in the footer) to reduce vertical space.

**Follow-up 2:** History visualization approach: proceed with a simple list of period rows for MVP?
**Answer:** Yes, proceed with a simple list of period rows.

**Follow-up 3:** Binary vs numeric display in history: for binary standards, should the history list show a binary progress bar, or show counts like X / minimum?
**Answer:** Use the progress bar, and mirror numeric standards using counts. We also decided we should remove binary activities and remove Activity `inputType` altogether, treating all standards/logs as numeric with appropriate units (e.g., “sessions”).

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
Not applicable.

## Requirements Summary

### Functional Requirements
- Standard detail screen accessible via tapping the standard card (ensure clean UX with a separate Log button).
- Current period summary displays the same information as the dashboard card.
- Period history displayed as a simple list of period rows going back as far as logs exist, sorted most recent first.
- Each period row uses the same Met/In Progress/Missed status semantics and color tokens as elsewhere.
- Users can tap a period row to view logs for that period in a modal (simple, scrollable list).
- Detail screen includes actions: Log, Edit Standard, Archive.
- Dashboard card design should place the Log button next to the progress bar (not in a footer) to minimize vertical space.

### Reusability Opportunities
- No similar existing features were identified for direct reuse.

### Scope Boundaries
**In Scope:**
- Standard detail screen with current period summary.
- Period history list (all periods with logs, most recent first) with status and progress visualization.
- Period logs modal when selecting a period.
- Actions: Log, Edit Standard, Archive.
- Dashboard card interaction + layout adjustments to support tap-to-detail while keeping Log easily accessible.

**Out of Scope:**
- Visual chronology / bar-chart timeline history visualization (explicitly deferred as a possible future iteration).
- Any explicitly excluded items (none specified).

### Technical Considerations
- Ensure the dashboard card supports both tap-to-detail and an in-card Log button without gesture conflicts.
- Period history computation should be deterministic and aligned with existing period window/status logic.
- Remove Activity `inputType` entirely; treat logs and standards as numeric everywhere (use units like “sessions” for count-based standards).
