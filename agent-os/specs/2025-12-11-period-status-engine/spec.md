# Specification: Period + status engine

## Goal
Provide a shared, deterministic utility that computes daily/weekly/monthly period windows in the device timezone and derives period status (Met / In Progress / Missed) from period totals.

## User Stories
- As a performance-minded user, I want my current period label and status to be unambiguous so that I can course-correct before the period ends.
- As a developer, I want a shared period/status utility with strong tests so that all screens compute totals and status consistently.

## Specific Requirements

**Shared period calculator utility**
- Implement as a shared TypeScript utility (no UI)
- Provide a stable API shape returning period window boundaries, a period key, and a user-facing label
- Work for `daily`, `weekly`, and `monthly` cadences

**Period boundary semantics**
- Model windows as start-inclusive and end-exclusive to avoid off-by-one and precision issues
- Ensure boundary behavior is correct at end-of-period transitions

**Daily period definition**
- Window is the local day in the device timezone
- Label uses Month, day, year ordering

**Weekly period definition (Monday-start)**
- Week starts on Monday in the device timezone
- Label uses Month, day, year ordering for any displayed dates

**Monthly period definition**
- Window spans the local month in the device timezone
- Label uses Month, day, year ordering when a specific date is shown

**Device-timezone behavior**
- Period assignment and labeling use the current device timezone
- If the device timezone changes, subsequent period labeling and rollups use the new timezone

**Status derivation**
- Met when period total is greater than or equal to the minimum
- In Progress when the period is still open and total is below minimum
- Missed when the period has ended and total is below minimum
- “Period ended” is determined using the calculated period end boundary

**Tests for boundary cases**
- Add focused unit tests for end-of-period boundaries
- Add focused unit tests covering a DST transition day
- Add focused unit tests covering a timezone-change scenario

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**Shared domain types**
- Reuse `StandardCadence` and timestamp millisecond conventions from `packages/shared-model`
- Keep compatibility with `ActivityLog.occurredAtMs` and other timestamp-ms fields

**Shared validation schemas**
- Reuse `standardCadenceSchema` and timestamp-ms validation conventions from `packages/shared-model/src/schemas.ts`

**Timestamp helpers**
- Follow the timestamp normalization patterns in `packages/firestore-model/src/timestamps.ts` for handling timestamps consistently

## Out of Scope
- Dashboard UI changes
- Log entry UI changes
- Standard history UI changes
- Firestore schema changes beyond what is required to consume the utility
- Server-side/materialized rollups (precomputed period totals)
- Custom cadences beyond daily/weekly/monthly
- Notification/reminder logic
