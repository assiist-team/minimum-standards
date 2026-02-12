# Data Model: Activity Category & Edit in Create Flow

**Feature**: 002-activity-category-edit-in-create-flow
**Date**: 2026-02-11

## No Schema Changes Required

This feature does not introduce any new entities or modify existing data models. All required fields and operations already exist:

### Activity (unchanged)

**Collection**: `/users/{userId}/activities/{activityId}`

| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| name | string | Display name |
| unit | string | Unit of measurement (plural) |
| categoryId | string \| null | Reference to Category (already exists in schema) |
| notes | string \| null | Optional notes |
| createdAtMs | number | Creation timestamp |
| updatedAtMs | number | Last update timestamp |
| deletedAtMs | number \| null | Soft delete timestamp |

**Key point**: The `categoryId` field already exists on the Activity type in `packages/shared-model/src/types.ts`. The `useActivities` hook's `createActivity` and `updateActivity` functions already support reading and writing this field. The only gap was that `ActivityModal` never included it in its form.

### Category (unchanged)

**Collection**: `/users/{userId}/categories/{categoryId}`

| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| name | string | Display name |
| isSystem | boolean | Whether this is a system category (e.g., uncategorized) |
| order | number | Sort order for display |

Provided by the `useCategories()` hook via `orderedCategories` (sorted by `order`).

## Component State Changes

### ActivityModal (new local state)

| State Variable | Type | Default | Description |
|---------------|------|---------|-------------|
| categoryId | string \| null | `activity?.categoryId ?? null` | Selected category for the activity |
| categoryPickerVisible | boolean | false | Controls BottomSheetMenu visibility |

### SelectActivityStep (state removed)

| Removed State | Reason |
|--------------|--------|
| showCategoryPicker | Inline picker removed; category editing now via ActivityModal |
| selectedCategoryId | No longer needed; category read from activity object directly |

| Added State | Type | Default | Description |
|------------|------|---------|-------------|
| editModalVisible | boolean | false | Controls ActivityModal (edit mode) visibility |
