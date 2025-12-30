# Fix Activity History Period Boundaries

## Problem Statement

Activity History displays inconsistent period boundaries because historical documents store **frozen snapshots** of period calculations that were made with buggy logic, while current period boundaries are calculated correctly.

### Current Broken Behavior
- **Historical periods**: Show wrong dates (calculated with Monday alignment when created)
- **Current period**: Shows correct dates (calculated with custom alignment)
- **Log fetching**: Now uses correct boundaries, but historical boundaries are permanently wrong

### Root Cause
Activity history documents store calculated period boundaries (`periodStartMs`, `periodEndMs`, `periodLabel`) as frozen snapshots, but the calculation logic had bugs that are now fixed. This creates a permanent mismatch.

## Solution Overview

**Store reference timestamps instead of calculated boundaries, and recalculate boundaries in the UI** using the historical standard configuration with current calculation logic.

### Why This Works Despite Standard Changes

Standards can change over time, but the `standardSnapshot` in each historical document captures the **exact configuration that existed when that period was completed**. This means:

1. **Configuration changes are preserved**: Each historical document remembers what the standard looked like at completion time
2. **Logic fixes are retroactive**: We use the current (fixed) `calculatePeriodWindow()` logic
3. **Boundaries are recalculated correctly**: Using historical config + fixed logic

### New Design
```
Historical Document:
├── referenceTimestampMs (when period was calculated)
├── standardSnapshot (complete config at completion time)
└── rollup data (calculated with historical boundaries)

UI Recalculation:
const boundaries = calculatePeriodWindow(
  referenceTimestampMs,
  standardSnapshot.cadence,           // Historical cadence
  timezone,
  { periodStartPreference: standardSnapshot.periodStartPreference } // Historical preference
);
```

This gives correct boundaries even when:
- Standard preferences change (historical docs use old preferences)
- Calculation logic was buggy (we use fixed logic)
- Standards evolve over time (each period remembers its config)

## Implementation Plan

### Phase 1: UI Recalculation (Immediate Fix)

#### 1. Create Boundary Recalculation Function
Add to `apps/mobile/src/utils/activityHistory.ts`:

```typescript
/**
 * Recalculates period boundaries for historical documents using:
 * - Historical standard configuration (from when period was completed)
 * - Current calculation logic (with any bug fixes)
 */
export function recalculateHistoricalBoundaries(
  row: ActivityHistoryRow,
  timezone: string
): PeriodWindow {
  // Use the reference timestamp that was stored when document was created
  // This could be row.periodStartMs (current) or a new referenceTimestampMs field
  const referenceTimestamp = row.periodStartMs; // or row.referenceTimestampMs

  return calculatePeriodWindow(
    referenceTimestamp,
    row.standardSnapshot.cadence,           // Historical cadence
    timezone,
    { periodStartPreference: row.standardSnapshot.periodStartPreference } // Historical preference
  );
}
```

#### 2. Update Activity History Display
Modify `ActivityHistoryScreen.tsx` to recalculate boundaries:

```typescript
// Instead of using stored row.periodStartMs, row.periodEndMs, row.periodLabel
const boundaries = recalculateHistoricalBoundaries(row, timezone);

// Use boundaries.startMs, boundaries.endMs, boundaries.label
```

#### 3. Update Card Rendering
Ensure `StandardProgressCard` uses recalculated boundaries for all display elements.

### Phase 2: Data Migration (Optional)

#### Option A: Keep Backward Compatibility
Continue storing calculated boundaries in documents but ignore them in UI, preferring recalculated values.

#### Option B: Migrate Document Schema
Remove `periodStartMs`, `periodEndMs`, `periodLabel` from future documents and recalculate them in UI.

**Migration strategy:**
- New documents: Don't store calculated boundaries
- Old documents: Keep for backward compatibility but recalculate in UI
- Future: Remove calculated fields from old documents

### Phase 3: Engine Changes

#### Update Activity History Engine
Modify `useActivityHistoryEngine.ts` to stop storing calculated boundaries:

```typescript
// Remove from writeActivityHistoryPeriod call:
// window.startMs, window.endMs, window.label

// Keep only:
// referenceTimestampMs: window.startMs (as reference for recalculation)
```

#### Update Document Schema
Modify `ActivityHistoryDoc` type to remove calculated boundary fields:

```typescript
interface ActivityHistoryDoc {
  // Remove: periodStartMs, periodEndMs, periodLabel, periodKey
  referenceTimestampMs: number; // Reference for boundary calculation
  standardSnapshot: ActivityHistoryStandardSnapshot;
  // ... other fields
}
```

### Phase 4: Rollup Recalculation (Future)

#### Address Log Boundary Mismatch
Historical documents may have rollup data calculated with wrong period boundaries. Consider:

**Option A: Accept and Document**
- Historical rollup data used wrong boundaries but is "good enough"
- Document this limitation

**Option B: Recalculate Rollups**
- Re-query logs using correct boundaries when displaying historical data
- Expensive but provides accurate historical data

## Implementation Steps

### Step 1: Add Recalculation Function
Create `recalculateHistoricalBoundaries` in `activityHistory.ts`

### Step 2: Update UI Components
Modify `ActivityHistoryScreen.tsx` to use recalculated boundaries instead of stored ones

### Step 3: Test Boundary Consistency
Verify historical and current periods use identical calculation logic

### Step 4: Update Engine (Future)
Modify engine to store reference timestamps instead of calculated boundaries

### Step 5: Migration Plan
Decide how to handle existing documents with wrong boundaries

## Testing Strategy

### Unit Tests
- Test `recalculateHistoricalBoundaries` produces same results as live calculation
- Verify boundary recalculation works for all cadence types and preferences

### Integration Tests
- Test Activity History screen shows consistent boundaries
- Verify current and historical periods align correctly
- Test preference changes update both current and historical displays

### Edge Cases
- Documents created before `periodStartPreference` feature
- Preference changes after periods complete
- Timezone changes
- DST boundary periods

## Benefits

### ✅ Handles Standard Changes
Each historical document preserves the exact standard configuration that existed when the period was completed, so boundary calculations reflect what the standard actually was at that time.

### ✅ Retroactive Bug Fixes
Historical data automatically uses the current (fixed) calculation logic, correcting any past boundary calculation errors.

### ✅ Single Source of Truth
All period boundaries calculated with `calculatePeriodWindow()`, ensuring consistency between current and historical periods.

### ✅ Future-Proof
- Changes to period calculation logic automatically apply to all historical data
- Standard configuration changes don't break historical accuracy
- No need to migrate or update historical documents when logic changes

## Risks and Mitigations

### Risk: Standard Configuration Changes
**Analysis**: Standards can change after historical periods are created, but this is handled correctly because each document preserves its configuration snapshot.
**Mitigation**: No action needed - the design explicitly handles this.

### Risk: Performance Impact
**Mitigation**: Boundary calculation is lightweight, cache results if needed

### Risk: Breaking Changes
**Mitigation**: Keep backward compatibility, migrate gradually

### Risk: Historical Accuracy
**Mitigation**: Document that rollup data may use old boundaries, consider recalculation option

## Rollout Plan

### Phase 1 (Immediate): UI Recalculation
- Deploy boundary recalculation in UI
- Historical documents show correct dates immediately
- No data changes required

### Phase 2 (Future): Engine Updates
- Modify engine to store reference timestamps
- Update document schema
- Migrate existing data

### Phase 3 (Future): Rollup Fixes
- Address historical rollup accuracy if needed

## Success Criteria

- ✅ Historical and current periods show consistent boundaries
- ✅ Period calculations use single source of truth
- ✅ UI updates automatically when calculation logic changes
- ✅ No performance degradation
- ✅ Backward compatibility maintained