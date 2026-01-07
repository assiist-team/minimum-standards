# Activity History Enhancements Plan

## Objective
- Provide a concise, drillable overview before the detailed period-by-period log list to keep historical context top-of-mind.

### Mobile-First Reality
- Activity History lives inside the mobile app only; every component must assume ~360–414 px width with safe-area padding.
- Prioritize vertical stacking, single-row controls, and lightweight labels so nothing depends on desktop real estate.
- Carousels, horizontal scrolling, or condensed typography are acceptable tradeoffs if they keep insights visible without forcing modals.

## Scope Overview
1. **Stats panel** sitting above the period history list.
2. **Volume visualization suite** (daily activity, period accumulation, indexed period completion, standard trend).
3. **Chart navigation shell** (tabs by default, dropdown fallback) so users can move between visualizations quickly.

---

## 1. Stats Panel

### Data Points
- **Total `<unit>`**: Sum of activity values across the currently selected time range; the unit label comes from the activity standard (e.g., “Total Calls”).
- **% Met**: Percentage of periods within the selected range where the user met or exceeded the standard.
- **Count Met**: Displayed as `X / Y periods`, reinforcing how % Met was derived.
- **Standard Change**: Show initial → current standard minimum (e.g., `500 ➝ 1,250 calls/week`). When there have been >2 changes, show first and latest; tap/tooltip can expose the intermediate steps.

### Layout & Interaction
- Single horizontal card where all stats fit on a single row across breakpoints (allow horizontal scrolling or responsive compression on narrow screens—no stacked layout).
- Each metric should surface its calculation basis via tooltip/help icon.
- The stats panel listens to the same filters as the charts/list (date range, activity, standard).

### Edge Cases
- No data: Show skeleton state plus guidance (“Start logging to see trends”).
- Partial data (e.g., first week in progress): indicate with badge (e.g., “period in progress”).
- Standard change unavailable: if the activity has never had a standard update, render the stat with the label “Standard Change” and body copy “No changes yet.” Only hide the row when the user explicitly turns that stat off.

---

## 2. Volume Visualization Suite

Display the section title “Volume Visualization” with a clean dropdown selector aligned on the same row (title left, dropdown right) inside a single mobile-safe row (use truncated title + compact dropdown). Dropdown defaults to “Daily Volume” and lists all four chart names; no tabs.

All charts consume the same filtered dataset (activity, date range, timezone) and should feel consistent with the mobile marketing site aesthetic (`minimum_standards_website/index.html`).

### Chart A — “Daily Volume”
- **What**: Standard bar chart where the x-axis is calendar days and the bar height is the total activity logged for that day.
- **Why**: Gives the fastest read on pace and streaks—are we logging anything today?
- **Details**
  - Use native day labels (Mon 1/12, Tue 1/13, etc.); collapse to tick marks when space is tight.
  - Bars change color when the day’s volume pushes the period into “met” territory, reinforcing accountability.
  - Tap reveals the day’s entries and link to edit logs.

### Chart B — “Daily Progress”
- **What**: Still uses days on the x-axis, but each bar represents the **cumulative** volume for the current period up to that day. Bars reset to zero at the start of the next period.
- **Why**: Shows intra-period momentum and how quickly the user is closing the gap each week.
- **Details**
  - Overlay a horizontal line at the period goal (the standard minimum for that period) so users know when the cumulative stack crosses the threshold.
  - Shade background bands to differentiate periods along the same axis.
  - Tooltip shows: day, cumulative total, remaining volume to goal, days left in period.

### Chart C — “Period Progress”
- **What**: X-axis is simply the ordered list of periods (1, 2, 3…). Bars represent the goal volume, and a fill inside each bar represents the actual logged volume (0–100%+).
- **Why**: Fastest way to scan consistency across many periods, even when date labels would get cramped.
- **Details**
  - Highlight current period with a subtle glow.
  - On tap/hover, surface the actual date range (e.g., “Week of Jan 6”) plus goal vs. actual numbers.
  - Support overflow fill above 100% to celebrate over-performance without truncation.

### Chart D — “Standards Progress”
- **What**: Line chart showing the standard minimum over time (e.g., the user raised their weekly call goal from 500 to 2,500).
- **Why**: Visual proof of ambition and context for interpreting streaks—missing a goal after a big standard jump looks different than missing an old baseline.
- **Details**
  - Y-axis mirrors the units from the activity (calls, hours, etc.).
  - Anchor line points to the start date of each new standard so it lines up with the period bars below.
  - Pair with annotations when the user edits the standard mid-period.

### Shared Behaviors
- All charts sync selection: tapping a bar/day highlights the matching period in the history list.
- Use the global “clean time” filter drawer; changing the range re-queries all charts plus the stats panel in one call.
- Maintain animation parity (200–250 ms ease) so switching between charts feels intentional.
- Design for mobile-first canvases (~320 px width). Default to portrait-friendly aspect ratios (e.g., 3:4) and allow horizontal scroll if a chart absolutely cannot compress.

---

## 3. Chart Navigation & Interaction

- **Primary control**: clean dropdown selector aligned with the “Volume Visualization” title (title left, dropdown right). Options: “Daily Volume,” “Daily Progress,” “Period Progress,” “Standards Progress.”
- The control group must stay on one row even on narrow screens: short title label, dropdown with icon-only chevron, optional pill container that can horizontally scroll.
- Dropdown remains available on all breakpoints; no tab variant. Ensure the touch target meets mobile sizing and supports keyboard navigation.
- Provide a short description under the active chart (one sentence) so users remember what the viz represents.
- Maintain previously chosen chart in local storage so power users return to their preferred view.
- Instrument dropdown changes to learn which charts deliver the most value.

---

## Data & Engineering Considerations
- **API aggregation**: Need an endpoint (or client-side selector) that returns:
  - Totals per period plus status (Met/Missed/In Progress).
  - Daily totals (aggregated from logs) for the selected date range.
  - Per-day cumulative totals reset at each period boundary (server does the math to keep the client light).
  - Full standard history (value + effective date) for building the trend line and “Standard Change” stat.
- **Caching**: When users adjust filters frequently, memoize or cache recent query results.
- **Timezone alignment**: Period boundaries must respect the user’s configured timezone to avoid split weeks.
- **Performance**: Chart render should stay <100 ms for 52+ periods; consider pagination or lazy rendering if historical range is large.
- **Accessibility**: Ensure stats have textual equivalents; chart colors must meet contrast ratios and include patterns/pattern fills for color-blind users.

---

## Analytics & Instrumentation
- Track filter changes, chart selections (which tab is most popular), and tooltip/period drill actions.
- Log the distribution of range selections to prioritize optimization.
- Capture when users export/share screenshots (if added later) to gauge reporting needs.

---

## Open Questions
1. What is the maximum historical range we need to support (rolling year, full history)?
2. Should “% Met” include periods still in progress?
3. Do we expose the entire standard change history or just endpoints?
4. Does the product need export/share functionality for these aggregates?
5. Should reps be able to compare two activities side-by-side?

---

## Proposed Delivery Phases
1. **Foundations**
   - Expose API aggregates (daily totals, period totals, cumulative series, standard history).
   - Build shared filter state + selection bus for stats, charts, and list.
2. **Stats Panel**
   - Implement single-row card, tooltips, loading/empty states, “No changes yet” copy.
3. **Visualization Shell**
   - Build chart container, tab/dropdown control, shared legend + tooltip component.
4. **Charts**
   - 4a: Ship “Daily Volume” + “Goal Tracker” since they share the day axis.
   - 4b: Ship “Period Bars” + “Standard Trend” (line chart stacked above or behind as needed).
5. **Validation & Polish**
   - Usability test (min 5 reps), accessibility sweep, analytics hooks, doc updates.
