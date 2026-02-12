# Research: Activity Category & Edit in Create Flow

**Feature**: 002-activity-category-edit-in-create-flow
**Date**: 2026-02-11

## Research Question 1: Does ActivityModal already support categoryId in its save flow?

**Decision**: No — ActivityModal currently does not handle `categoryId` at all.

**Rationale**: Reading `apps/mobile/src/components/ActivityModal.tsx`, the modal manages three form fields (name, unit, notes) and passes them to `createActivity()` or the `onSave` callback. The `createActivity` function in `useActivities` hook accepts `Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'>` which includes `categoryId`, but ActivityModal never populates it.

**Alternatives considered**: None — this is the gap that needs fixing.

## Research Question 2: Does useActivities.updateActivity already support categoryId?

**Decision**: Yes — fully supported with optimistic updates.

**Rationale**: In `apps/mobile/src/hooks/useActivities.ts`, lines 308-310, the `updateActivity` function explicitly handles `categoryId`:
```typescript
if (updates.categoryId !== undefined) {
  normalizedUpdates.categoryId = updates.categoryId ?? null;
}
```
It also tracks category updates via `lastCategoryUpdateRef` for snapshot reconciliation. No changes needed to the hook.

**Alternatives considered**: N/A — existing implementation is correct.

## Research Question 3: Does useActivities.createActivity support categoryId?

**Decision**: Yes — the function accepts any field on the Activity type (minus timestamps/id).

**Rationale**: The `createActivity` signature is `Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'>`, and the Activity type includes `categoryId: string | null`. The payload is passed to `toFirestoreActivity()` which handles the conversion. No changes needed.

**Alternatives considered**: N/A.

## Research Question 4: What is the existing category picker pattern in the codebase?

**Decision**: Use `BottomSheetMenu` — the same component used in `ActivitySettingsScreen` for category assignment.

**Rationale**: `ActivitySettingsScreen.tsx` (line ~65-68) uses `BottomSheetMenu` with `assignMenuVisible` state to present a list of categories when editing an activity's category. This is an established pattern. The `SelectActivityStep` had a custom inline overlay that deviated from this pattern — that's the broken control being removed.

**Alternatives considered**:
- Inline dropdown: Rejected — no existing pattern in the app, would require new component
- Full-screen picker: Rejected — overkill for a short list of categories

## Research Question 5: What does the SelectActivityStep category picker look like currently?

**Decision**: It's a custom overlay with `showCategoryPicker` state that renders a positioned view on top of the step content, partially obscured by the Next button.

**Rationale**: The SelectActivityStep manages `showCategoryPicker` boolean state and renders a custom picker overlay (not using the shared BottomSheet/BottomSheetMenu components). This was likely implemented before the BottomSheet components were standardized in WP01/WP06. The overlay's z-index/positioning conflicts with the fixed Next button at the bottom of the screen.

**Alternatives considered**: N/A — the entire picker is being removed, not fixed.
