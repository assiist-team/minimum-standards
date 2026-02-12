# Feature Specification: Activity Category & Edit in Create Flow

**Feature Branch**: `002-activity-category-edit-in-create-flow`
**Created**: 2026-02-11
**Status**: Draft
**Mission**: software-dev
**Parent Feature**: 001-standards-navigation-overhaul

## Problem Statement

The Create Standard flow has two UX gaps introduced during the 001-standards-navigation-overhaul implementation:

1. **Missing category field**: When creating or editing an activity (via ActivityModal), there is no way to set or change the activity's category. The Category field was omitted from the modal form.

2. **Misplaced category control**: The SelectActivityStep screen contains an inline category picker bottom sheet that only allows changing the category of the selected activity. This control is partially obscured by the Next button and is confusing — it edits a single property rather than offering full activity editing.

3. **No edit access**: Users cannot edit the full details (name, unit, category, notes) of an already-selected activity from within the Create Standard flow. They must leave the flow entirely and go to Settings > Activities to make changes.

## User Scenarios & Testing

### User Story 1 — Set Category When Creating an Activity (Priority: P1)

A user taps "+" to create a standard and reaches Step 1 (Select Activity). They tap "Create New Activity." The ActivityModal opens with fields for Name, Unit, **Category**, and Notes. The user fills in the name, picks a unit, selects a category from a picker, optionally adds notes, and saves. The new activity appears in the list with its category already assigned.

**Why this priority**: Without a category field in the creation modal, activities are always created as uncategorized, forcing users into a separate Settings flow to fix it.

**Independent Test**: Open Create Standard flow → tap "Create New Activity" → verify the Category field is present in the modal → select a category → save → verify the new activity shows the assigned category.

**Acceptance Scenarios**:

1. **Given** the user opens the ActivityModal (create mode), **When** the form renders, **Then** a Category picker field is displayed between the Unit and Notes fields.
2. **Given** the user taps the Category field, **When** the picker opens, **Then** it displays "None" plus all user-defined categories.
3. **Given** the user selects a category and saves the activity, **When** the activity is created, **Then** its `categoryId` is persisted to the data store.
4. **Given** the user does not select a category, **When** they save, **Then** the activity is created with `categoryId: null` (uncategorized).

---

### User Story 2 — Set Category When Editing an Activity (Priority: P1)

A user opens the ActivityModal in edit mode (from Settings > Activities or from the Select Activity step). The Category field is present and shows the activity's current category. The user can change it or clear it to "None."

**Why this priority**: Same gap as US1 — the edit modal also lacked the Category field.

**Independent Test**: Open ActivityModal in edit mode for an activity with a category → verify Category field shows current category → change it → save → verify the update persists.

**Acceptance Scenarios**:

1. **Given** the user opens ActivityModal in edit mode, **When** the form renders, **Then** the Category field displays the activity's current category (or "None" if uncategorized).
2. **Given** the user changes the category and saves, **When** the update completes, **Then** the activity's `categoryId` reflects the new selection.
3. **Given** the user sets the category to "None" and saves, **When** the update completes, **Then** the activity's `categoryId` is set to null.

---

### User Story 3 — Edit Selected Activity from Create Standard Flow (Priority: P1)

A user is on Step 1 (Select Activity) of the Create Standard flow and has selected an activity. An Edit button appears next to or below the selected activity. The user taps Edit, and the ActivityModal opens in edit mode pre-populated with the activity's current details (name, unit, category, notes). The user makes changes, saves, and returns to the Select Activity step with the updated details reflected.

**Why this priority**: Users need to be able to correct activity details without abandoning the Create Standard flow.

**Independent Test**: Select an activity on Step 1 → tap Edit → verify ActivityModal opens in edit mode with correct data → change the category → save → verify the updated category displays on the Select Activity screen.

**Acceptance Scenarios**:

1. **Given** the user has selected an activity on Step 1, **When** they look at the selected activity, **Then** an Edit button is visible.
2. **Given** the user has not selected any activity, **When** they look at the activity list, **Then** no Edit button is shown.
3. **Given** the user taps the Edit button, **When** the ActivityModal opens, **Then** it is in edit mode with the selected activity's name, unit, category, and notes pre-populated.
4. **Given** the user edits the activity and saves, **When** they return to Step 1, **Then** the updated activity details (including category) are reflected on screen.
5. **Given** the user opens the Edit modal and cancels, **When** they return to Step 1, **Then** no changes are made to the activity.

---

### User Story 4 — Remove Inline Category Picker from Select Activity Step (Priority: P1)

The existing inline category picker overlay / bottom sheet on the Select Activity step is removed entirely. Category assignment now happens exclusively through the ActivityModal (via Create or Edit).

**Why this priority**: The inline picker was confusing and partially obscured by the Next button. Removing it simplifies the screen and consolidates category management into one place.

**Independent Test**: Open the Create Standard flow → select an activity → verify there is no category picker overlay or bottom sheet on the Select Activity screen (only the Edit button for full activity editing).

**Acceptance Scenarios**:

1. **Given** the user is on Step 1 (Select Activity), **When** they select an activity, **Then** no category picker bottom sheet or overlay appears.
2. **Given** the user is on Step 1, **Then** the only way to change an activity's category is via the Edit button → ActivityModal.
3. **Given** the user is on Step 1, **Then** the selected activity's current category is still displayed as read-only information (e.g., "Category: Fitness").

---

### Edge Cases

- What happens if the user has no categories defined yet? → The Category picker in ActivityModal shows only "None." The user can create categories later via Settings > Categories.
- What happens if a category is deleted after being assigned to an activity? → The activity's category displays as "None" (existing uncategorized behavior applies).
- What happens if the user edits the selected activity's unit in the Edit modal after already proceeding to Step 2 and then going back? → The flow should reflect the updated unit on Step 2 since it inherits from the activity.

## Requirements

### Functional Requirements

**ActivityModal — Category Field**

- **FR-001**: The ActivityModal MUST include a Category picker field in both create and edit modes.
- **FR-002**: The Category field MUST appear between the Unit field and the Notes field in the form layout.
- **FR-003**: The Category picker MUST display a "None" option followed by all user-defined categories.
- **FR-004**: In create mode, the Category field MUST default to "None" (no category pre-selected).
- **FR-005**: In edit mode, the Category field MUST display the activity's current category.
- **FR-006**: When saving, the selected category MUST be persisted as `categoryId` on the Activity document (null for "None").

**Select Activity Step — Edit Button**

- **FR-007**: The Select Activity step MUST display an Edit button when an activity is selected.
- **FR-008**: The Edit button MUST NOT appear when no activity is selected.
- **FR-009**: Tapping the Edit button MUST open ActivityModal in edit mode, pre-populated with the selected activity's current data.
- **FR-010**: After saving changes in the Edit modal, the Select Activity step MUST reflect the updated activity details immediately.

**Select Activity Step — Remove Inline Category Picker**

- **FR-011**: The inline category picker overlay / bottom sheet MUST be removed from the Select Activity step.
- **FR-012**: The selected activity's category MUST still be displayed as read-only text on the Select Activity step (e.g., "Category: Fitness" or "Category: None").
- **FR-013**: All category-picker-related state and handlers in the Select Activity step MUST be cleaned up (no dead code).

### Key Entities

- **Activity**: Gains full category management through the ActivityModal. Key change: `categoryId` is now settable during creation and editing via the modal form.
- **Category**: No changes to the entity itself. Used as the data source for the Category picker in ActivityModal.

## Assumptions

- The `useCategories()` hook already provides the list of categories needed for the picker.
- The `updateActivity()` function from `useActivities()` already supports updating `categoryId`.
- The ActivityModal already accepts an `activity` prop for edit mode and an `onSave`/`onSelect` callback pattern.
- The existing BottomSheetMenu component (or a similar picker pattern) can be reused for the category selection inside ActivityModal.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can assign a category to a new activity during creation without leaving the Create Standard flow.
- **SC-002**: Users can edit all details (name, unit, category, notes) of a selected activity from within Step 1 of the Create Standard flow.
- **SC-003**: Zero inline category pickers or obscured controls remain on the Select Activity step.
- **SC-004**: The Category field appears in ActivityModal in both create and edit modes with correct default values.
