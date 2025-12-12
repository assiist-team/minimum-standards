# Spec Requirements: Period + status engine

## Initial Description
Implement a shared “period calculator” that computes daily/weekly (Monday-start)/monthly windows and labels in the device timezone and derives status (Met / In Progress / Missed) from period totals, with unit tests for boundary cases (end-of-period, timezone changes).

## Requirements Discussion

### First Round Questions

**Q1:** I’m assuming the “period calculator” is a pure TypeScript utility (shared between app + tests) that takes a Date (or timestamp) plus the device timezone and returns: periodStart, periodEnd, periodKey, and a user-facing label. Is that correct, or do you want a different API shape?
**Answer:** Yeah, the calculator is a utility. And I think that API shape is right.

**Q2:** For period boundaries, I’m assuming we model each window as [startInclusive, nextStartExclusive) (rather than “end at 23:59:59”) to avoid DST/precision bugs. OK, or do you explicitly want inclusive “end-of-day” semantics?
**Answer:** I’m fine with the period boundaries.

**Q3:** For timezone changes, I’m assuming we do no timezone pinning (we don’t store timezone on logs/standards), meaning period assignment is recomputed using the current device timezone when viewing totals/status. Is that correct, or should we freeze timezone per-log or per-standard to prevent historical totals from shifting after travel?
**Answer:** I’m good with your time zone approach.

**Q4:** For weekly/monthly labels, I’m assuming:
- Weekly label: “Week of YYYY‑MM‑DD” (Monday start date)
- Monthly label: “MMM YYYY”
- Daily label: YYYY‑MM‑DD
Is that the exact format you want, or should we match the dashboard’s more descriptive example (“Week of Dec 8–14”)?
**Answer:** I don’t like your weekly or daily labels. I prefer Month, day, year.

**Q5:** For status derivation, I’m assuming “period ended” means now ≥ periodEnd (with the same timezone basis as the period calculation). Correct?
**Answer:** Looks fine.

**Q6:** For tests, I’m assuming we must cover at least: end-of-period boundary, DST transition day, and timezone-change scenario. Any other “must not break” cases you want included?
**Answer:** Looks fine.

**Q7:** What’s explicitly out of scope for this feature?
**Answer:** Nothing is explicitly out of scope.

### Existing Code to Reference
No similar existing features identified for reference.

### Follow-up Questions
No follow-up questions were asked.

## Visual Assets

No visual assets provided.

## Requirements Summary

### Functional Requirements
- Implement a shared, reusable period calculator utility.
- Compute daily/weekly (Monday-start)/monthly period windows in the device timezone.
- Derive status (Met / In Progress / Missed) from period totals vs minimum.
- Provide user-facing period labels using Month, day, year formatting (user preference).
- Include unit tests for boundary cases (end-of-period, DST transition day, timezone changes).

### Reusability Opportunities
- No existing similar features identified for reference.

### Scope Boundaries
**In Scope:**
- The shared period calculation and status derivation utility.
- Tests for time boundary and timezone scenarios.

**Out of Scope:**
- None explicitly.

### Technical Considerations
- Periods computed in device timezone.
- Weekly start day is Monday.
- Period window semantics are acceptable as [startInclusive, nextStartExclusive).
- Label formatting should be Month, day, year (exact final string formats to be decided during spec writing/implementation if needed).
