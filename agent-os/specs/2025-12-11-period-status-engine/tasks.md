# Task Breakdown: Period + status engine

## Overview
Total Tasks: 2

## Task List

### Shared Utilities

#### Task Group 1: Period calculator + status derivation utility
**Dependencies:** None

- [ ] 1.0 Complete period/status utility
  - [ ] 1.1 Write 2-8 focused unit tests for period windows + labels + status
    - Cover daily boundary behavior at end-of-day transition
    - Cover weekly boundary behavior with Monday-start
    - Cover monthly boundary behavior (month start/end)
    - Cover a DST transition day in a representative timezone
    - Cover a timezone-change scenario (same timestamps evaluated in different device timezones)
    - Cover status derivation (Met / In Progress / Missed) using period end boundary
  - [ ] 1.2 Define the utility’s public API and types
    - Inputs: `StandardCadence`, `TimestampMs` (ms), device timezone identifier (IANA)
    - Outputs: period start/end boundaries (ms), stable period key, user-facing label
    - Status helper: derive status from (periodTotal, minimum, now, period end)
  - [ ] 1.3 Implement period window calculation
    - Daily: local calendar day window
    - Weekly: Monday-start week window in device timezone
    - Monthly: local calendar month window
    - Use start-inclusive/end-exclusive semantics consistently
  - [ ] 1.4 Implement period labeling (Month, day, year preference)
    - Daily label uses Month, day, year ordering
    - Weekly label avoids “Week of …”; use a date range label in Month, day, year ordering
    - Monthly label uses Month, year (and Month, day, year when specific dates are displayed)
    - Ensure labels are deterministic and timezone-aware
  - [ ] 1.5 Ensure utility tests pass
    - Run ONLY the tests written in 1.1

**Acceptance Criteria:**
- The 2-8 tests written in 1.1 pass
- Period windows are correct and deterministic for daily/weekly/monthly
- Week starts on Monday
- Period window semantics are start-inclusive and end-exclusive
- Status derivation matches: Met if total >= minimum; Missed if period ended and total < minimum; otherwise In Progress
- Period labels follow the Month, day, year preference and do not use “Week of …”

### Testing

#### Task Group 2: Test review + targeted gap fill (feature-scope only)
**Dependencies:** Task Group 1

- [ ] 2.0 Validate feature correctness and fill critical gaps only
  - [ ] 2.1 Review tests added in Task Group 1
    - Confirm coverage for: end-of-period, DST day, timezone-change scenario, and status derivation
  - [ ] 2.2 Add up to 6 additional tests maximum (only if critical gaps exist)
    - Focus on edge conditions discovered during implementation (e.g., year boundary weeks, leap day month)
    - Avoid exhaustive formatting/locale matrices
  - [ ] 2.3 Run feature-specific tests only
    - Run ONLY tests from 1.1 and 2.2 (if added)

**Acceptance Criteria:**
- Feature-specific tests pass
- No more than 6 additional tests are added in 2.2
- Behavior is stable across boundary conditions required by the spec

## Execution Order

Recommended implementation sequence:
1. Period calculator + status derivation utility (Task Group 1)
2. Test review + targeted gap fill (Task Group 2)
