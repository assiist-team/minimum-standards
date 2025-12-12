# Specification: Activity Library (create + reuse)

## Goal
Enable users to create, edit, and reuse Activities through a shared Activity Library that works both as a standalone management screen and inside the Standards Builder so setup stays fast and consistent.

## User Stories
- As a standards creator, I want to quickly search or create an Activity without leaving the builder so I stay in flow while defining a new Standard.
- As a user maintaining my catalog, I want a dedicated Activity Library where I can search, edit, or delete Activities so the list stays clean and up to date.
- As a developer, I want a single Activity creation experience that works across entry points so form logic and validation stay consistent.

## Specific Requirements

**Dual entry points and navigation**
- Provide a standalone Activity Library screen accessible from the app navigation plus an entry inside the Standards Builder step 1.
- Use the same list component in both contexts; the builder version may present as a modal/sheet but reuses the shared logic.
- When invoked from the Standards Builder, dismiss the library (or modal) immediately after a selection or successful create and pass the chosen Activity back to the builder state.
- Standalone mode stays on the library after actions so users can continue managing Activities.
- Ensure both contexts enforce per-user scoping (only the signed-in user’s `/users/{uid}/activities`).

**Search and list presentation**
- Pin a search input at the top of the list; filter results client-side in real time with ~300ms debounce and case-insensitive name matching.
- Support partial/substring search so any activity whose name includes the query (not only prefix matches) is returned; implement via `name.toLowerCase().includes(query.toLowerCase())` on the client cache.
- Default ordering is alphabetical by activity name when no search term is present; update results live as the user types.
- Show the full list when the query is empty; no “recently used” section or special grouping.
- Support scrolling large lists smoothly (virtualized FlatList or equivalent) and keep a visible “Add Activity” action available at the top-right or sticky footer.
- While loading, show a lightweight skeleton; if the library is empty simply render the standard list chrome with the create button (no bespoke empty-state copy).

**Reusable Add / Edit Activity modal**
- Tapping “Add Activity” opens a modal form that can be launched from either context.
- Fields: name (string, max 120), unit (string, max 40), input type picker (`number` / `yes_no`); enforce the shared-model constraints with inline validation messaging.
- Submit disables while pending and surfaces backend errors inline.
- From the Standards Builder context, close the modal upon success, auto-select the new Activity, and return focus to the builder.
- The same modal supports editing when invoked with an existing Activity; prefill fields and persist updates using the shared converter.

**Unit normalization and display**
- Accept either singular or plural text in the Unit field, but normalize to plural form before persisting using the `pluralize` npm library.
- Store the normalized plural value so that Standards inherit a consistent default unit.
- Display units via `pluralize(unit, count)` wherever activity counts appear (e.g., preview in builder) to get “1 call” vs “20 calls.”
- Log validation errors if normalization fails (e.g., blank string) and keep the user on the form.

**Activity management (edit & delete)**
- Standalone library exposes edit and delete affordances per row (e.g., swipe actions or overflow menu); the builder entry point hides destructive controls.
- Editing reuses the modal described above and preserves `createdAtMs`.
- Delete performs a soft delete by setting `deletedAtMs`/`deletedAt` via the existing converters; confirm with the user before finalizing.
- Filter soft-deleted Activities out of all lists; optionally allow undo within a short toast/snackbar window in standalone mode.

**Data flow and integration**
- Sync Activities via the Firestore path `/users/{uid}/activities` with the existing `activityConverter` so timestamps remain server-controlled.
- Leverage offline persistence so search works on cached data; queue creates/edits/deletes with optimistic UI updates that rollback on failure.
- Reuse the shared-model types and Zod schemas to validate payloads before writes and to drive TypeScript props for the list + modal.
- Centralize list/query logic in a hook/service (e.g., `useActivities`) that both contexts import to avoid divergent state handling.

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**`packages/shared-model/src/schemas.ts`**
- Provides `activitySchema` constraints (name ≤120 chars, unit ≤40 chars, allowed input types) that should drive form validation and TS types.
- Aligns with Zod parsing already used elsewhere, so reusing it guarantees consistency with backend validation.

**`packages/firestore-model/src/converters.ts`**
- Includes `activityConverter` with serverTimestamp handling and soft-delete behavior; reuse it for all CRUD operations so Firestore writes stay consistent.
- Mirrors the schemas above, so leaning on it avoids duplicating serialization logic for timestamps and deletedAt handling.

**`firebase/firestore.rules`**
- `validActivity` enforces allowed keys, required server timestamps, and per-field limits; ensure writes from the library satisfy these checks to prevent rejections.
- The `/users/{uid}/activities` match block already scopes reads/writes to the signed-in user, so the UI should respect that hierarchy when composing queries.

**`packages/shared-model/src/types.ts`**
- Supplies the `Activity` and `ActivityInputType` definitions plus shared timestamp conventions to keep builder and library props in sync.
- Importing these types into the mobile app avoids divergent shapes between data fetching hooks and Firestore converters.

## Out of Scope
- “Recently used” Activity sections or surfacing Standards that reference an Activity.
- Searching by unit, tags, or metadata beyond the name.
- Unit suggestions, autocomplete chips, or unit-specific formatting heuristics.
- Bulk editing, multi-select delete, or mass archive flows.
- Sharing Activities between users or viewing other users’ libraries.
- Rich empty state illustrations or copy beyond the base list UI.
- Activity usage analytics, history timelines, or audit trails.
- Activity cloning or template generation features.
- Desktop-specific layouts or responsive breakpoints beyond standard mobile handling.
- Changes to Standard builder steps beyond the Activity selection step.
