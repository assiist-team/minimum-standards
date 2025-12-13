Based on your idea for Standard detail + history, I have some clarifying questions:

1. I assume users will access this detail screen by tapping on a standard card from the Active Standards Dashboard (rather than a separate "View Details" button); is that correct, or should we add an explicit "View Details" action on each card?

2. I'm thinking the current period summary section should display the same information shown on the dashboard card (Activity name, period label, current total / target, status, progress bar) but in a more expanded format; should we keep it consistent with the dashboard card style, or make it more prominent/visual on the detail screen?

3. For the period history list, I assume we should show all past periods (going back as far as logs exist) sorted by most recent first, with each row showing period label, total, target, and status badge; is that correct, or should we limit to a specific number of periods (e.g., last 12 months or last 20 periods)?

4. The spec mentions "(if included in MVP) the logs list for a selected period" - I'm assuming this means users can tap a period in the history list to expand/show logs for that period; should we include this logs list feature in MVP, or defer it to a later release?

5. I'm thinking the detail screen should include actions like "Log" (deep link to logging modal), "Edit Standard" (navigate to builder), and "Archive" (if not already archived); should we include all of these, or keep the screen read-only with just a "Log" action for MVP?

6. Should the period history list use the same status color tokens (Met/In Progress/Missed) as the dashboard, and should each history row be tappable to show logs (if included), or should history rows be read-only indicators?

7. Are there elements you explicitly want to exclude from this screen (e.g., charts/graphs, export functionality, period comparison views, or editing logs directly from this screen)?

**Existing Code Reuse:**
Are there existing features in your codebase with similar patterns we should reference? For example:
- Similar interface elements or UI components to re-use
- Comparable page layouts or navigation patterns
- Related backend logic or service objects
- Existing models or controllers with similar functionality

Please provide file/folder paths or names of these features if they exist.

**Visual Assets Request:**
Do you have any design mockups, wireframes, or screenshots that could help guide the development?

If yes, please place them in: `agent-os/specs/2025-12-12-standard-detail-history/planning/visuals/`

Use descriptive file names like:
- standard-detail-mockup.png
- period-history-wireframe.jpg
- lofi-detail-layout.png
- mobile-view.png
- existing-ui-screenshot.png

Please answer the questions above and let me know if you've added any visual files or can point to similar existing features.
