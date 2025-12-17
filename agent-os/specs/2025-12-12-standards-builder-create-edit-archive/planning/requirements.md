# Spec Requirements: Standards builder (create/edit + archive)

## Initial Description
Implement the two-step Standard builder (pick/create Activity → set cadence + minimum + unit) and allow archiving/unarchiving, producing a clear display rule like “1000 calls / week.”

## Requirements Discussion

### First Round Questions

**Q1:** I assume the first step should default to showing recently used Activities plus a search/create option, with the Activity form mirroring the Activity Library fields. Is that correct, or should the builder only link to pre-existing Activities with a separate “create Activity” flow?  
**Answer:** Do not show recently used Activities until the user taps into the search field. When they focus the search input, render up to five recently used Activities underneath; as they type, replace that list with search results. Place the “create Activity” affordance beside the search bar and, when used, launch the reusable Activity creation modal.

**Q2:** I’m thinking cadence options stay limited to daily, weekly (Monday start), and monthly, inheriting the defaults from the period calculator. Should we support custom cadences (e.g., every 2 weeks) in this release?  
**Answer:** Support custom cadences from the outset so the core system is based on custom intervals and avoids future rework. Include convenience controls for daily/weekly/monthly, but design the data model/UI to handle arbitrary cadence definitions now.

**Q3:** For the minimum + unit step, I assume we auto-fill the unit from the selected Activity but allow overriding both the numeric minimum and unit (e.g., convert “calls” to “minutes”). Do you want any guardrails like unit suggestions or validation ranges beyond the shared Zod schema?  
**Answer:** Auto-fill the unit from the Activity and allow overrides. Activities will not provide a numeric minimum, so the user always enters that value. No extra unit suggestions or validation ranges beyond existing schemas are required.

**Q4:** To keep the “1000 calls / week” display rule consistent, I plan to store a normalized summary string on each Standard and regenerate it whenever cadence, minimum, or unit changes. Would you rather compute that string on the fly everywhere it’s displayed?  
**Answer:** Looking for help understanding the implications of storing versus computing, but otherwise aligned with the normalized summary approach once the trade-offs are clarified.

**Q5:** For archive/unarchive, should archived Standards move to a dedicated list with read-only history and stay accessible for reactivation, and do we need to automatically stop logging into them or migrate logs when unarchived?  
**Answer:** Archived Standards must live in their own list, separate from active ones. User expectation is unclear about “stop logging” or “migrating logs,” so the experience should clarify those behaviors.

**Q6:** Are there any flows or edge cases you explicitly want to exclude from this release (e.g., multi-user standards, template creation, bulk edits)?  
**Answer:** No exclusions.

### Existing Code to Reference
No similar existing features identified for reference.

### Follow-up Questions

**Follow-up 1:** Does the proposed `{interval, unit}` cadence structure (with optional advanced fields) cover the custom cadence flexibility you want, or should we also support patterns like “X times per business week” right now?  
**Answer:** The base `{interval, unit}` approach without specific weekdays or rolling windows is sufficient for now; those more advanced patterns can come later.

**Follow-up 2:** Should archived Standards block new logs entirely until reactivated, or do you expect to allow logging but simply hide them from active lists?  
**Answer:** Archived Standards are view-only until unarchived, meaning logging is disabled while they remain archived.

## Visual Assets

No visual assets provided.

## Requirements Summary

### Functional Requirements
- Two-step builder: Activity selection/search with delayed recent list, reusable Activity creation modal, then cadence + minimum/unit configuration.
- Search field shows five recent Activities only after focus, transitions to search results on input, and restores recents when cleared.
- Cadence configuration supports arbitrary `{interval, unit}` combinations plus quick-select shortcuts for daily/weekly/monthly.
- Minimum/unit step auto-fills the unit from the Activity, requires manual minimum entry, and allows overriding the unit without extra suggestions.
- Standards store a normalized summary string (e.g., “1000 calls / week”) regenerated when cadence or unit data changes.
- Archived Standards appear in a dedicated list with read-only history and cannot accept new logs until reactivated.

### Reusability Opportunities
- Reuse the existing Activity creation modal when the user selects “create Activity.”
- Leverage current Zod schemas and period calculator logic for validation and cadence interpretation.

### Scope Boundaries
**In Scope:**
- Activity selection flow with combined recent/search behavior and inline creation.
- Custom cadence support using numeric interval + unit pairs, including convenience controls.
- Minimum and unit configuration, normalized summary string persistence, and archive/unarchive UX with view-only archived state.

**Out of Scope:**
- Advanced cadence modifiers such as specific weekday selections, business-day logic, or rolling windows.
- Additional flows beyond builder + archive (e.g., templates, bulk edits) and any special handling for log migration (logs remain attached to Standards).

### Technical Considerations
- Model cadences as `{interval: number, unit: 'day' | 'week' | 'month' | ...}` with hooks for future weekday/rolling-window extensions.
- Store and regenerate a normalized summary string whenever relevant Standard attributes change to ensure consistent display across the app.
- Archived Standards must be flagged to disable logging attempts while still surfacing historical data.
- Activity selection UI should integrate with existing Activity Library search and the reusable creation modal to prevent duplicate logic.





