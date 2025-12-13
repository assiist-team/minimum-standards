# Specification: Standards Library

## Goal
Enable users to view, search, and manage all their Standards (active and archived) through a unified Standards Library screen, with one-tap activation/archiving and the ability to create new Standards by pre-filling from existing ones.

## User Stories
- As a user managing my Standards, I want a single place to view all my Standards (active and archived) with search so I can quickly find and reactivate past Standards.
- As a user creating a new Standard, I want to select an existing Standard to pre-fill the form so I can quickly create similar Standards without re-entering all the details.
- As a user, I want to activate or archive Standards with one tap so I can manage my active Standards list efficiently.

## Specific Requirements

**Standalone Standards Library screen**
- Provide a standalone Standards Library screen accessible from app navigation (similar to Activity Library entry point in HomeScreen).
- Display all Standards organized into two tabs: "Active" and "Archived" (no separate template concept—just Standards).
- Ensure per-user scoping so users only see their own Standards from `/users/{uid}/standards`.
- Include a back/close button to return to the home screen.

**Tab navigation for Active and Archived**
- Implement tab navigation to switch between Active and Archived views (no existing tab pattern in codebase—needs implementation).
- Active tab shows Standards where `archivedAtMs` is null and `state === 'active'`.
- Archived tab shows Standards where `archivedAtMs` is not null or `state === 'archived'`.
- Tab selection persists for the session but resets when navigating away and returning.

**Search functionality across all Standards**
- Pin a search input at the top of the screen; filter results client-side in real time with ~300ms debounce.
- Search filters by Standard summary string using case-insensitive substring matching: `summary.toLowerCase().includes(query.toLowerCase())`.
- Search works across all Standards regardless of which tab is active (searches both active and archived).
- When search query is present, filter the current tab's Standards; when empty, show all Standards in the active tab.
- Default ordering is alphabetical by summary when no search term is present; update results live as the user types.

**One-tap activation and archiving**
- For archived Standards: Show an "Activate" button that immediately unarchives the Standard (sets `archivedAtMs` to null, `state` to 'active') with no confirmation dialog.
- For active Standards: Show an "Archive" button that immediately archives the Standard (sets `archivedAtMs` to current timestamp, `state` to 'archived') with no confirmation dialog.
- Use existing `archiveStandard` and `unarchiveStandard` functions from `useStandards` hook.
- After activation/archiving, update the UI immediately with optimistic updates; rollback on failure.

**Pre-fill Standards Builder from existing Standard**
- When creating a new Standard via Standards Builder, allow users to select an existing Standard to pre-fill the form.
- Pre-fill: Activity (via `activityId`), cadence, minimum, and unit from the selected Standard.
- Load the Activity object using the `activityId` reference and populate the builder store accordingly.
- If user changes any values before saving: Create a new Standard with a new ID.
- If user doesn't change anything before saving: Activate the existing Standard instead of creating a duplicate (check match on `activityId`, `cadence`, `minimum`, and `unit`).

**Duplicate prevention logic**
- When saving from Standards Builder, check if the form values match an existing Standard.
- Match criteria: Same `activityId`, `cadence` (interval + unit), `minimum`, and `unit`.
- If match found and Standard is archived: Unarchive it instead of creating a new one.
- If match found and Standard is active: Show an error or silently activate (no duplicate creation).
- Comparison should normalize cadence objects and compare all fields exactly.

**List presentation and rendering**
- Use FlatList for efficient rendering of Standards lists (similar to Activity Library pattern).
- Display each Standard showing: summary string, activity name (via lookup), cadence display, and minimum/unit.
- Show archive/activate button per row based on Standard's current state.
- While loading, show a lightweight skeleton; if library is empty, render standard list chrome with appropriate empty state.
- Support smooth scrolling for large lists with virtualization.

**Data flow and integration**
- Leverage existing `useStandards` hook for fetching Standards and archive/unarchive operations.
- Use Firestore path `/users/{uid}/standards` with existing `standardConverter` so timestamps remain server-controlled.
- Reuse offline persistence so search works on cached data; queue archive/unarchive operations with optimistic UI updates.
- Centralize Standards list/query logic in `useStandards` hook that the library screen imports.
- When pre-filling builder, use `useStandardsBuilderStore` to populate form state from selected Standard.

**Navigation integration**
- Add "Standards Library" button to HomeScreen navigation (similar to "Activity Library" button).
- Add new `RootView` type value: `'standardsLibrary'` to App.tsx navigation state.
- Wire up navigation from HomeScreen to Standards Library screen.
- Standards Library screen accepts `onBack` callback to return to home.

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**`apps/mobile/src/screens/ActivityLibraryScreen.tsx`**
- Provides the screen structure pattern to follow: search input, list rendering, create/edit actions, and navigation handling.
- Demonstrates debounced search filtering logic (`filterActivitiesBySearch`) that can be adapted for Standards summary filtering.
- Shows FlatList rendering pattern and empty state handling that should be replicated.

**`apps/mobile/src/hooks/useActivities.ts`**
- Demonstrates hook pattern with debounced search, real-time Firestore subscription, and optimistic updates.
- Shows `filterActivitiesBySearch` function using case-insensitive substring matching that should be replicated for Standards.
- Provides pattern for managing search query state with debounced updates (~300ms).

**`apps/mobile/src/hooks/useStandards.ts`**
- Already provides `archiveStandard` and `unarchiveStandard` functions that should be reused.
- Exposes `standards`, `activeStandards`, and `archivedStandards` arrays that can be filtered for the library.
- Handles Firestore subscriptions and converter logic that the library screen should leverage.

**`apps/mobile/src/stores/standardsBuilderStore.ts`**
- Provides Zustand store for managing Standards Builder form state (Activity, cadence, minimum, unit).
- Includes `setSelectedActivity`, `setCadence`, `setMinimum`, `setUnitOverride` setters that can be called to pre-fill from existing Standard.
- Contains `generatePayload` function that can be used to compare form values against existing Standards for duplicate detection.

**`apps/mobile/App.tsx` and `HomeScreen`**
- Shows navigation pattern for adding new screens to app navigation (Activity Library, Standards Builder, etc.).
- Demonstrates `RootView` type and `setView` state management that should be extended for Standards Library.
- Provides button pattern in HomeScreen that should be replicated for Standards Library entry point.

**`packages/shared-model/src/types.ts` and `schemas.ts`**
- Provides `Standard` type definition with `archivedAtMs`, `state`, `summary`, `activityId`, `cadence`, `minimum`, and `unit` fields.
- Contains Zod schemas for validation that should be used when comparing Standards for duplicates.
- Includes `formatStandardSummary` helper that generates the summary string used for search filtering.

## Out of Scope
- Separate "template" object or collection (Standards Library is just a view of existing Standards).
- Local-only storage (all Standards stored in Firestore per-user).
- Sharing/import functionality between users (per roadmap note).
- Creating templates from scratch (users create Standards normally via Standards Builder).
- Explicit "save as template" action (all Standards automatically included in library).
- Categories, tags, or custom organization beyond Active/Archived tabs.
- Usage counts, analytics, or preview functionality for Standards.
- Template editing (Standards are edited through normal Standard editing flow, not in library).
- Recently used Standards section or special grouping.
- Bulk operations (archive/unarchive multiple Standards at once).
- Search by Activity name or other fields beyond summary string.
- Desktop-specific layouts or responsive breakpoints beyond standard mobile handling.
