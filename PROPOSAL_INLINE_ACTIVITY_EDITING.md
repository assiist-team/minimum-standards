# Proposal: Eliminate Activities Modal & Enable Inline Editing

## Current State

The StandardsBuilderScreen currently:
1. Uses a dropdown to select from existing activities
2. Has a "Create" button that opens ActivityModal (full-screen modal)
3. Shows selected activity card with edit button that opens ActivityModal
4. Requires separate activity management flow

## Proposed Solution

### 1. Replace Activity Selection UI with Inline Inputs

**Replace:**
- Dropdown selector
- "Create" button
- Selected activity card with edit button

**With:**
- Direct text inputs for Activity Name and Unit
- Optional dropdown/search for existing activities (collapsible/optional)
- Inline editing capability

### 1a. UX Rules (Create Standard + Edit Standard)

This proposal supports **editing activities while creating standards** and **editing standards**, with the same behavior in both places:

- If the user is **creating a new activity** (no existing activity selected), we create a new activity record on save (or reuse an exact match).
- If the user **selects an existing activity**, the form is now editing that activity’s fields (name/unit).
- If the user **changes name/unit for a selected existing activity**, we must show a **small confirmation dialog** before we persist the change, because updating an Activity can impact other standards that reference it.

Important constraint:

- We **do not** create “shadow” activities (no “create new + relink”) as a side effect of editing an existing standard. If the user modifies a selected existing activity’s fields, we update that activity record after confirmation.

### 2. Update Store State

**Current store state:**
```typescript
selectedActivity: Activity | null;
```

**New store state:**
```typescript
activityName: string;
activityUnit: string;
selectedActivityId: string | null; // For edit mode or when selecting existing
```

### 3. Save Flow Logic

When saving a standard:
1. If `selectedActivityId` exists and name/unit match → use existing activity
2. If `selectedActivityId` exists but name/unit changed → **confirm**, then update activity
3. If no `selectedActivityId` → search for activity by name+unit
   - If found → use it
   - If not found → create new activity

#### 3a. Confirmation Dialog (when editing an existing activity)

Trigger the confirmation only when all are true:

- `selectedActivityId` exists (user selected an existing activity)
- name/unit differ from the persisted activity values
- the activity is linked to other standards (ideally compute `usedByCount > 1`; if not available, default to showing the dialog when changing a selected existing activity)

Copy guidelines (example, adjust for tone):

- Title: **Update activity?**
- Body: **This activity is used by other standards. Updating it will update those standards too.**
- Actions: **Cancel** / **Update**

If available, show a factual count to reduce anxiety:

- Body: **This activity is used by \(N\) standards. Updating it will update them too.**

### 4. UI Changes

**Step 1 Section:**
```
┌─────────────────────────────────────┐
│ Step 1                              │
│ Activity                            │
│                                     │
│ Activity Name                       │
│ [___________________________]        │
│                                     │
│ Unit                                │
│ [___________________________]        │
│                                     │
│ [Optional: Use existing activity ▼] │
└─────────────────────────────────────┘
```

### 4a. UX Spec (great-UX details)

This section defines **exactly what the user sees** when creating or editing activities inline, and how we avoid accidental duplicates and surprising updates.

#### UI Components (Step 1: Activity)

- **Activity Name**: text input
  - Placeholder: “e.g. Push-ups”
  - Behavior: trims leading/trailing whitespace; preserves user casing while typing
- **Suggestions (default, always-on)**: a lightweight results list shown as the user types Activity Name
  - Shows 3–8 best matches (name + unit)
  - Tapping a suggestion selects an existing activity (sets `selectedActivityId`) and fills both fields
  - If the user keeps typing without selecting, they remain in “new activity draft” mode (`selectedActivityId = null`)
- **Unit**: text input (or picker if we have one)
  - Placeholder: “e.g. reps, minutes, miles”
  - Behavior: normalize to canonical form (see “Normalization” below)
- **Activity chooser (optional)**: a compact “Browse all” / “View all activities” affordance (collapsible)
  - Uses the same underlying search/results UI as Suggestions
  - Useful when the user doesn’t know what to type yet
- **Linked indicator** (only when an existing activity is selected):
  - Small, calm line below inputs, e.g. “Using existing activity”
  - If we can compute usage count: “Used by N standards”

#### Primary flows

##### Flow A (primary): Typeahead-first selection while typing

1. User types in **Activity Name**.
2. A **Suggestions** list appears immediately (default behavior).
3. The user can choose either:
   - **Select an existing activity**: tap a suggestion
     - Name + Unit populate
     - Linked indicator appears (“Using existing activity”, optionally “Used by N standards”)
   - **Create a new activity**: continue typing and fill Unit without selecting
     - UI shows a calm helper line: “New activity will be created”

On Save:

- If `selectedActivityId` is set → use the existing activity (and potentially update it if modified; see Flow C)
- If `selectedActivityId` is null:
  - If an exact match exists (name+unit) → reuse it and (optionally) show a subtle one-time toast: “Using existing activity”
  - Else → create the activity, then continue saving the standard

**What the user sees while saving:**

- Save button enters a loading state (“Saving…”)
- Inputs are disabled during save
- If activity creation succeeds but the standard save fails, show a clear error and keep the user on the screen (do not lose typed values)

##### Flow B (secondary): Browse/select an existing activity without typing much

1. User taps “Browse all” / “View all activities”.
2. The form populates Activity Name + Unit.
3. Linked indicator appears: “Using existing activity” (and optionally “Used by N standards”).
4. If the user saves without modifying name/unit, we just use the existing activity id.

##### Flow C: Edit an existing (linked) activity inline (Create Standard or Edit Standard)

This is the “power-user” flow: the user selected an existing activity, then changes name and/or unit.

**When to show confirmation**

- Show the confirmation **only when** the user is about to persist a mutation to an existing activity record:
  - `selectedActivityId` exists
  - name/unit differ from persisted values
  - and (ideally) the activity is used by other standards (`usedByCount > 1`)
  - if `usedByCount` is not available cheaply, still confirm on mutation to a selected existing activity (omit the count)

**When to show it**

- Show confirmation **on Save**, not on every keystroke. This keeps typing frictionless and puts the decision at the moment of commitment.

**Confirmation dialog UX**

- Title: “Update activity?”
- Body:
  - If count known: “This activity is used by N standards. Updating it will update those standards too.”
  - If unknown: “This activity is used by other standards. Updating it will update those standards too.”
- Actions:
  - Primary: “Update”
  - Secondary: “Cancel”

**Post-confirmation feedback**

- After the activity update + standard save completes, show a subtle success confirmation (toast/snackbar): “Saved”

##### Flow D: Edit Standard screen with an activity already selected

- When the user enters edit mode for a standard, prefill name/unit from the linked activity.
- The same rules apply: if they change name/unit and save, prompt (Flow C).

#### Notes on the suggestions UI (what “great UX” means here)

- Suggestions are **default** and **always-on** while typing (not an optional enhancement).
- Keep it calm: no full-screen overlays; it should feel like “assist,” not “mode change.”
- If the user has already selected an existing activity (`selectedActivityId` set), suggestions can collapse or become less prominent to reduce visual noise.

#### Normalization rules (avoid surprises)

- **Unit**:
  - Normalize to canonical form on blur or on save (choose one; be consistent)
  - If normalizing on blur, do it gently (single transformation) and keep the field displaying the canonical value afterward
- **Name**:
  - Store a canonical form for matching (e.g., lowercased/trimmed) but keep display casing as entered (unless you want title-casing, which can feel heavy-handed)

### 5. Implementation Steps

1. **Update `standardsBuilderStore.ts`**
   - Replace `selectedActivity` with `activityName`, `activityUnit`, `selectedActivityId`
   - Update `getEffectiveUnit()` to use `activityUnit`
   - Update `generatePayload()` to handle activity creation/update

2. **Update `StandardsBuilderScreen.tsx`**
   - Remove ActivityModal import and usage
   - Replace activity selector UI with inline inputs
   - Update save handler to create/update activities
   - Remove activity dropdown and related state

3. **Update `handleSave` function**
   - Add logic to find or create activity
   - Handle activity updates if editing existing

4. **Optional: Add activity autocomplete**
   - Show suggestions as user types activity name
   - Allow selecting existing activity to pre-fill both fields

## Code Structure

### Store Changes
```typescript
interface StandardsBuilderState {
  // Activity (inline editing)
  activityName: string;
  activityUnit: string;
  selectedActivityId: string | null; // For edit mode
  
  setActivityName: (name: string) => void;
  setActivityUnit: (unit: string) => void;
  setSelectedActivityId: (id: string | null) => void;
  
  // ... rest of state
}
```

### Save Handler Logic
```typescript
const handleSave = async () => {
  // 1. Validate activity fields
  if (!activityName.trim() || !activityUnit.trim()) {
    setSaveError('Activity name and unit are required');
    return;
  }
  
  // 2. Find or create activity
  let activityId: string;
  if (selectedActivityId) {
    // Check if name/unit changed
    const existing = activities.find(a => a.id === selectedActivityId);
    if (existing && (existing.name !== activityName || existing.unit !== activityUnit)) {
      // Confirm, then update existing activity (may impact other linked standards)
      const confirmed = await confirmUpdateLinkedActivity({
        activityId: selectedActivityId,
        // optionally: usedByCount
      });
      if (!confirmed) return;

      await updateActivity(selectedActivityId, {
        name: activityName.trim(),
        unit: activityUnit.trim().toLowerCase(),
      });
    }
    activityId = selectedActivityId;
  } else {
    // Search for existing activity
    const existing = activities.find(
      a => a.name.toLowerCase() === activityName.trim().toLowerCase() &&
           a.unit.toLowerCase() === activityUnit.trim().toLowerCase()
    );
    
    if (existing) {
      activityId = existing.id;
    } else {
      // Create new activity
      const newActivity = await createActivity({
        name: activityName.trim(),
        unit: activityUnit.trim().toLowerCase(),
        notes: null,
      });
      activityId = newActivity.id;
    }
  }
  
  // 3. Continue with standard creation/update...
};
```

## Migration Considerations

- Edit mode: Pre-fill `activityName` and `activityUnit` from existing activity
- Backward compatibility: Activities still stored in Firestore, just managed differently
- No breaking changes to data model

## Notes / Open Questions (for implementation)

- **Computing “used by \(N\)”**: ideally derive the count of standards referencing `activityId` (server-side query or indexed field). If that’s not available cheaply, the confirmation can still be shown whenever a selected existing activity is being mutated, but the count should be omitted.
- **Normalization**: lowercasing `unit` is fine, but avoid surprises by normalizing at a consistent time (e.g., on blur or immediately after save) and ensuring the UI reflects the persisted value.

## Benefits

1. **Simpler UX**: No modal interruptions
2. **Faster workflow**: Direct typing
3. **Less code**: Remove ActivityModal component
4. **Better discoverability**: Activity fields visible in main form
5. **Flexible**: Can still reference existing activities if needed
