# Dummy Data Plan: Cold Calls

This document outlines the plan for generating dummy activity log data for the "Cold calls" activity to test the Activity History screen.

## Requirements Summary

- **Activity**: Cold calls
- **Metric**: calls
- **Total Volume**: 10,000 - 11,000 calls
- **Progression**: Start at ~500/week, scaling up to ~2,500/week
- **Entry Constraints**: 
  - Each log entry: 50 - 500 calls
  - Daily limit: Max 500 calls per day

## Data Distribution & Standard Progression (7-Week Plan)

To visualize how the standard changed over time, we will simulate the user increasing their commitment each week.

| Week | Standard (Goal) | Actual Logs | Daily Breakdown (Value per Log Entry) | Weekly Status |
| :--- | :--- | :--- | :--- | :--- |
| **Week 1** | **500** | 500 | Mon: 200, Wed: 200, Fri: 100 | Met |
| **Week 2** | **750** | 750 | Mon: 250, Tue: 250, Thu: 250 | Met |
| **Week 3** | **1,000** | 1,100 | Mon: 300, Tue: 300, Wed: 300, Thu: 200 | Met |
| **Week 4** | **1,500** | 1,500 | Mon: 400, Tue: 400, Wed: 400, Thu: 300 | Met |
| **Week 5** | **1,750** | 1,900 | Mon: 500, Tue: 500, Wed: 500, Thu: 400 | Met |
| **Week 6** | **2,000** | 2,300 | Mon: 500, Tue: 500, Wed: 500, Thu: 500, Fri: 300 | Met |
| **Week 7** | **2,500** | 2,500 | Mon: 500, Tue: 500, Wed: 500, Thu: 500, Fri: 500 | Met |
| **Total** | | **10,550** | | |

## Implementation Strategy: Logs First, Engine Builds History

Earlier revisions of this plan wrote `ActivityHistoryDoc` rows directly, which led to duplicate periods once the Activity History engine also generated rows for the same weeks.  
The updated approach seeds **only the log entries**, then relies on the engine (running inside the mobile app) to backfill history rows deterministically.

### Steps
1. Run `scripts/seed-cold-calls.js` to wipe any previous cold-call logs/history for the test user and write the log entries for the 7-week progression.
2. Launch the app (or run the Activity History engine in dev tooling) to trigger `useActivityHistoryEngine`, which will:
   - detect the seeded logs,
   - compute the completed period rollups, and
   - write the `activityHistory` documents without duplication.
3. Run `node scripts/patch-cold-calls-history.js` to overwrite each completed period’s `standardSnapshot.minimum` so the series shows the planned goal ramp (500 ➝ 2,500). This script assumes the engine has already created the history docs.
4. If you need the history rows immediately after seeding, simply open the Activity History screen once; the engine runs globally at the app root.

### Log Entry Schema
Each entry will follow this structure (from `packages/shared-model/src/types.ts`):

```typescript
{
  id: "uuid-v4",
  standardId: "YOUR_STANDARD_ID",
  value: number, // (50-500)
  occurredAtMs: number, // (Timestamp for that specific day)
  note: null,
  editedAtMs: null,
  deletedAtMs: null,
  createdAtMs: Date.now(),
  updatedAtMs: Date.now()
}
```

## Generation Logic (Pseudo-code)

If you'd like to automate the creation of these logs, you can use a script that follows this logic:

1. **Set Start Date**: Pick a Monday starting 7 weeks ago.
2. **Loop Weeks**: For each week (1-7), calculate the daily values based on the table above.
3. **Generate Timestamps**: Set `occurredAtMs` to roughly 10:00 AM on each of those days to keep it realistic.
4. **Batch Upload**: Use the Firestore `batch` API to write the log entries to `users/{userId}/activityLogs`.
