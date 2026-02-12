# Implementation Plan: Activity Category & Edit in Create Flow

**Branch**: `002-activity-category-edit-in-create-flow` | **Date**: 2026-02-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `kitty-specs/002-activity-category-edit-in-create-flow/spec.md`

## Summary

Fix two UX gaps in the Create Standard flow: (1) add a Category picker field to ActivityModal so users can set/change category when creating or editing activities, and (2) replace the broken inline category picker on SelectActivityStep with an Edit button that opens ActivityModal in full edit mode.

**Technical approach**: Modify two existing components — `ActivityModal` and `SelectActivityStep` — using existing hooks (`useCategories`, `useActivities`) and the existing `BottomSheetMenu` component. No new components, hooks, or data model changes required.

## Technical Context

**Language/Version**: TypeScript 5.x, React Native 0.76+
**Primary Dependencies**: React Navigation (native stack), React Native Vector Icons (MaterialIcons), Zustand (stores), `@minimum-standards/shared-model`
**Storage**: Firestore (`/users/{userId}/activities/{activityId}` — `categoryId` field already supported)
**Testing**: Jest + React Native Testing Library (existing test infrastructure)
**Target Platform**: iOS and Android via React Native
**Project Type**: Mobile (monorepo with `apps/mobile/` and `packages/shared-model/`)
**Performance Goals**: Standard mobile UI responsiveness (60 fps, instant picker open)
**Constraints**: Offline-capable via Firestore persistence; optimistic updates pattern already in place
**Scale/Scope**: 2 files modified, ~100 lines added, ~80 lines removed

## Constitution Check

*No constitution file found. Skipped.*

## Project Structure

### Documentation (this feature)

```
kitty-specs/002-activity-category-edit-in-create-flow/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (references parent feature's model)
└── tasks.md             # Phase 2 output (/spec-kitty.tasks - NOT created here)
```

### Source Code (files to modify)

```
apps/mobile/src/
├── components/
│   └── ActivityModal.tsx          # ADD: Category picker field (BottomSheetMenu)
└── screens/
    └── create-standard/
        └── SelectActivityStep.tsx  # REMOVE: inline category picker
                                    # ADD: Edit button on selected activity
```

**Structure Decision**: This feature modifies 2 existing files in the mobile app. No new files or directories are created.

## Design

### Change 1: ActivityModal — Add Category Picker (FR-001 through FR-006)

**File**: `apps/mobile/src/components/ActivityModal.tsx`

**Current state**: The modal has three form fields — Name (TextInput), Unit (TextInput), Notes (TextInput). No category awareness.

**New state**: Add a Category field between Unit and Notes that:
- Renders as a tappable row showing the selected category name (or "None")
- On tap, opens a `BottomSheetMenu` listing "None" + all user-defined categories from `useCategories()`
- Stores selected `categoryId` in local state, initialized from `activity?.categoryId ?? null` in edit mode
- Includes `categoryId` in the save payload passed to `createActivity()` or `updateActivity()`

**Implementation details**:

1. Import `useCategories` hook and `BottomSheetMenu` component
2. Add state: `const [categoryId, setCategoryId] = useState<string | null>(activity?.categoryId ?? null)`
3. Add state: `const [categoryPickerVisible, setCategoryPickerVisible] = useState(false)`
4. Build menu items from `orderedCategories`:
   ```
   [{ key: 'none', label: 'None', onPress: () => setCategoryId(null) },
    ...orderedCategories.filter(c => !c.isSystem).map(c => ({
      key: c.id, label: c.name, onPress: () => setCategoryId(c.id)
    }))]
   ```
5. Add Category row JSX between Unit input and Notes input — styled as a tappable row with chevron icon, matching the pattern used in `ActivitySettingsScreen`
6. Include `categoryId` in the save handler's payload

### Change 2: SelectActivityStep — Edit Button + Remove Category Picker (FR-007 through FR-013)

**File**: `apps/mobile/src/screens/create-standard/SelectActivityStep.tsx`

**Remove** (inline category picker):
- State variables: `showCategoryPicker`, `selectedCategoryId`, and any related refs
- The category picker overlay/bottom sheet JSX (the custom overlay that slides up)
- All event handlers for the category picker (open, close, select)
- The `updateActivity` call that was only used for inline category changes

**Add** (Edit button):
- An Edit button (icon or text) visible in the selected activity details panel when an activity is selected
- State: `const [editModalVisible, setEditModalVisible] = useState(false)`
- The Edit button opens `<ActivityModal>` in edit mode with the selected activity
- On save callback: the activity list refreshes via the existing `useActivities()` subscription (Firestore snapshot listener), so the updated details appear automatically

**Keep unchanged**:
- Read-only display of the selected activity's category (already shows "Category: Fitness" or "Category: None")
- The "Create New Activity" button and its existing ActivityModal integration

## Complexity Tracking

*No constitution violations — no entries needed.*
