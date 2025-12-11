# Product Mission

## Pitch

Minimum Standards is a performance tracking app that helps people who care about performance (and believe success comes from committing to a plan and executing it consistently) maintain an active set of baseline commitments.
It does this by enabling fast, repeatable activity logging and automatically rolling logs up into daily/weekly/monthly periods with an always-current status (Met / In Progress / Missed).

## Users

### Primary Customers
- Performance-minded knowledge workers (e.g., entrepreneurs, operators, creators): Need simple, repeatable execution tracking (e.g., Pomodoros) without gamification.
- Performance-driven sales professionals: Need a fast way to log outreach/conversations throughout the day and see whether they’re on track for the current period.
- Fitness-focused individuals: Need a straightforward way to log sets/reps/sessions multiple times per period and confirm the minimum standard is met.

### User Personas

**Entrepreneur / Operator** (25–45)
- **Role:** Founder or operator running a small business
- **Context:** Juggling priorities; wants execution to be simple and measurable
- **Pain Points:** Drifts from core behaviors; loses track of progress until it’s “too late”; tools feel heavy or game-y
- **Goals:** Define minimum standards for the week and know, at a glance, whether they’re currently on track

**Salesperson** (22–40)
- **Role:** SDR/AE responsible for pipeline-generating activity
- **Context:** Activity happens in bursts; needs to log quickly between calls
- **Pain Points:** Inconsistent logging; unclear progress until end of week; manual tracking spreadsheets are slow
- **Goals:** Log multiple times per day in seconds and see current week progress toward minimums

**Fitness-focused individual** (18–50)
- **Role:** Training for strength/health goals
- **Context:** Workouts happen across sessions; wants baseline consistency
- **Pain Points:** Forgetting what was done; difficulty seeing current-period progress; too much emphasis on “streaks” in other apps
- **Goals:** Maintain baseline training standards and quickly confirm whether the current period is met

## The Problem

### Execution tracking breaks down in the moment
People who care about performance often have clear plans, but day-to-day execution tracking is too slow, ambiguous, or unreliable—so progress isn’t visible until after a period ends.
This leads to missed minimum standards for a given day/week/month and makes consistent execution harder.

**Our Solution:** Make logging doable in seconds (multiple times per period), make period boundaries unambiguous, and automatically aggregate logs into period totals with a truthful, always-current status.

## Differentiators

### Baseline-first, always-current status
Unlike spreadsheets, generic habit trackers, or gamified apps, we provide an always-current view of whether you’ve met the minimum for the current period, based on additive logs that roll up deterministically into period totals.
This results in faster course-correction during the period (not after) and clearer, more consistent execution of baseline standards.

## Key Features

### Core Features
- **Active Standards Dashboard:** See your active standards with the current period label, current period progress (e.g., “38 / 1000”), and status (Met / In Progress / Missed), plus a one-tap Log action.
- **Fast Logging Flow:** Log in seconds with a standard picker (search + recents), big numeric input, optional collapsed note, and a “Log another” affordance; support a “When?” control for backdating.
- **Standards Builder (Create/Edit):** Create or edit a standard by selecting/creating an Activity, then setting cadence (daily/weekly/monthly) and a minimum target (unit initialized from Activity and overridable when needed).
- **Automatic Period Rollups:** Aggregate multiple additive logs into deterministic period totals per standard and compute status (Met if total >= minimum; In Progress if period open and below minimum; Missed if period ended and below minimum).
- **History per Standard:** Review period totals over time (and optionally the logs within a period) to understand performance and audit entries.
- **Honest, Low-Friction Logging:** Make logging “0” possible and keep status/copy factual and neutral.
- **Edit/Delete Logs (Explicit):** Allow explicit edit/delete actions with immediate recomputation; prefer auditability (e.g., `editedAt`, soft-delete via `deletedAt`).
- **Timezone-Respecting Periods:** Compute and display periods using the device timezone; if timezone changes, subsequent period labeling and rollups use the new timezone.

### Collaboration Features
- **Intentionally single-player (MVP):** No social feed, competition, or sharing required to get value; standards templates are local-only initially.

### Advanced Features
- **Activity Library:** Reuse consistent Activities across standards (search + create, plus recently used).
- **Standards Templates Library:** Activate proven standards in one tap and save standards as templates when creating/editing (local-only in MVP).
- **Speed Enhancements:** Remember last-used standard and offer a “Last value (N)” quick-add chip for faster repeat logging.
- **Auto-save Logging (Later):** Start with explicit save; consider auto-save after stability and UX are validated.
