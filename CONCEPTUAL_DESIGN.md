# Minimum Standards — Conceptual Design (Working Spec)

This document defines the **conceptual UX** and **core domain model** for Minimum Standards.
It is the shared reference for product, design, and implementation.

---

## Product intent

The app exists to **improve status (met / missed / in progress) across an active set of minimum standards**.

- A **minimum standard** is a baseline requirement (the floor).
- Users **log activity as it happens** (multiple times per period).
- The system **aggregates logs into period totals** and evaluates status automatically.

Non-goals (at least initially):
- “Habit game” mechanics as the primary value (streaks, points, badges).
- Complex coaching, recommendations, or social features.

---

## Terminology (canonical)

- **Activity**: the thing the user does and can repeatedly log (e.g., “Sales Calls”, “Workout”, “Pages Read”).
  - Synonyms not used in-product: “action”.
- **Standard**: a commitment definition that binds an Activity to a minimum requirement over a cadence (e.g., “Sales Calls — 1000 / week”).
- **Log**: a single event entry of progress (e.g., “14 calls”, “24 calls”). Multiple logs roll up into a period.
- **Cadence**: the time window the Standard is evaluated against (Daily / Weekly / Monthly; custom later).
- **Period**: a specific instance of a cadence window (e.g., “2025‑12‑11”, “Week of 2025‑12‑08”, “Dec 2025”).
- **Status**: whether the aggregated total for a Period meets/exceeds the minimum (Met / Missed / In Progress).

---

## Core principles (UX)

- **Fast logging**: logging must be doable in seconds, repeatedly throughout the day.
- **Always current**: the Dashboard should show “where am I right now for this period?” for each active standard.
- **Truthful and low-friction**: the UI should make honest logging easy (including logging “0”).
- **No ambiguity about periods**: every log and view clearly indicates the Period it impacts.
- **Baseline focus**: emphasize meeting minimums; avoid making users optimize for “app points”.

---

## Domain model (conceptual)

### Activity

Reusable building block.

Fields (conceptual):
- **name**: short label (“Sales Calls”)
- **unit**: “calls”, “minutes”, “pages”, “dollars” (free text, later: suggestions)
- **inputType**:
  - number (most common)
  - yes/no (binary)
- optional: **category**, **notes**, **aliases**

Notes:
- Activities are reusable so “Sales Calls” stays consistent across Standards.

### Standard

Defines what “meeting the minimum” means for an Activity.

Fields (conceptual):
- **activityId**
- **minimum**: numeric threshold (e.g., 1000)
- **unit**: initialized from Activity unit; can be overridden per Standard if needed
- **cadence**: daily / weekly / monthly (custom later)
- **activeState**: active / archived
- optional: **displayRule**: generated sentence (“Complete at least 1000 calls per week.”)

### Log (ActivityLog)

A single logged event contributing toward a Standard’s current Period.

Fields (conceptual):
- **standardId** (or activityId + standardId; MVP can anchor to Standard)
- **value**: numeric (e.g., 14)
- **timestamp**: when it happened
- optional: **note** (e.g., “Morning session”)

Behavior:
- Multiple logs in the same Period are expected (e.g., “morning session”, “afternoon session”).
- Logs are additive; the UI should never require the user to “replace” their total for the Period.
- A log always affects exactly one Standard (MVP). (Later: logging to an Activity could optionally be allocated to one of multiple Standards.)

### Aggregation / Period rollups

The system derives, for each Standard and Period:
- **periodTotal** = sum of log values whose timestamps fall into the Period window
- **status**:
  - Met if periodTotal >= minimum
  - Missed if Period ended and periodTotal < minimum
  - In Progress if Period not ended and periodTotal < minimum

Important:
- Logs are **append-only** by default; editing/deleting logs is allowed but should be explicit.
- Rollups should be deterministic from logs + period definition.
- Over-target is allowed and should display plainly (e.g., “1200 / 1000”).

---

## Period definition (MVP rules)

### Daily
- Period label: YYYY‑MM‑DD in the user’s timezone
- Window: 00:00–23:59:59 local

### Weekly
- Period label: “Week of YYYY‑MM‑DD” (the start date)
- Window: start-of-week to end-of-week, local timezone
- Week starts on **Monday**

### Monthly
- Period label: “MMM YYYY”
- Window: first day 00:00 to last day 23:59:59, local timezone

### Timezone
- Periods are computed and displayed using the user’s **device timezone**.
- If the device timezone changes (travel), the app uses the new timezone for subsequent period labeling and rollups.

---

## Logging rules (MVP)

- **Default timestamp**: now (but allow editing/backdating via a simple “When?” control).
- **Backdated logs**:
  - Allowed **unlimited** (user can log for any past time).
  - Must clearly show the Period it will apply to before saving.
- **Editing/deleting logs**:
  - Allowed.
  - Must be explicit actions (e.g., “Edit log”, “Delete log”) and immediately recompute totals.
  - Implementation note: prefer soft-delete (`deletedAt`) and track `editedAt` for auditability.

## Libraries (reuse)

### Activity Library

Purpose: reuse consistent Activities across standards.

UX:
- Search + create (“Add Activity”)
- Shows recently used Activities

### Standards Library (Templates)

Purpose: reuse proven Standards (Activity + cadence + target).

UX:
- “Activate” one-tap to add to active set
- Option to create from scratch
- Option to “Save as template” when creating/editing a Standard

---

## Core screens (MVP)

### Dashboard (Active Standards)

Goal: see status at a glance + log quickly.

Per active Standard show:
- Activity name
- Minimum (e.g., “1000 calls / week”)
- **Current period progress**: “38 / 1000”
- Status: Met / In Progress / Missed
- Primary action: **Log**

Key UX detail:
- Dashboard should always show the **current Period label** somewhere (“Week of Dec 8–14”).

### Log flow (fast, repeatable)

Goal: log multiple times per period with minimal friction.

Entry points:
- Dashboard “Log” on a specific Standard
- Global “Log” button (then pick Standard)

Recommended MVP flow:
1. Select Standard (if not already selected)
2. Enter value (numeric keypad)
3. Save (or auto-save)
4. Immediately show updated progress for the current Period (“52 / 1000”)

Speed features (MVP-friendly):
- Remember last-used Standard
- Quick-add chip: **Last value (N)** (must display the number)
- Optional note (collapsed by default)
- “When?” control (defaults to now; enables backdating)

Recommended layout (MVP):
- A single **Log** screen that supports:
  - Standard picker (search + recents)
  - Big numeric input
  - Save button
  - After save: show updated total + a prominent “Log another” affordance

### Standard detail (History)

Goal: understand performance over time; inspect logs if needed.

Sections:
- Standard summary (minimum, cadence, current period progress)
- Period history list (period label, total, target, Met/Missed)
- Logs list for the selected Period (optional in MVP; useful for audit/debug)

### Create / Edit Standard (Builder)

Two-step builder:
1) Pick/create Activity
2) Set cadence + minimum target (+ unit if needed)

---

## Status states

- **In Progress**: current Period still open and total < target
- **Met**: total >= target (even if Period not ended)
- **Missed**: Period ended and total < target

Copy should remain neutral and factual.

---

## Key decisions to finalize (before implementation)

Decided:
- **Weekly start day**: Monday
- **Backdated logs**: unlimited
- **Log editing/deleting**: allowed
- **Timezone**: device timezone

Still open:
- **Activity unit ownership**:
   - Option A (recommended): Activity has a unit; Standard may override rarely.
   - Option B: unit belongs only to Standard (Activity is just a name).
- **Auto-save logs** vs explicit “Save”:
  - Recommendation: explicit save initially; upgrade to auto-save once stable.

---

## MVP scope (UX)

Must-have:
- Activity Library (create + reuse)
- Standards Library (Templates; reuse your prior standards locally; no sharing/import)
- Create Standard (Activity + cadence + minimum)
- Log value toward a Standard multiple times per Period
- Dashboard showing current Period progress and status
- History view per Standard (period totals at minimum)

Later:
- Sharing/import for standards templates
- Notifications/reminders
- Streaks/% status summaries (presented neutrally)
- Custom cadence windows


