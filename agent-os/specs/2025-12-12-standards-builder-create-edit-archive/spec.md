# Specification: Standards builder (create/edit + archive)

## Goal
Deliver a two-step Standards builder that lets users select or create an Activity, configure a custom cadence plus minimum/unit, and manage archived Standards in a separate, view-only space. Ensure the builder reuses existing Activity flows, enforces consistent summary strings, and blocks logging into archived Standards.

## User Stories
- As a performance-minded user, I want to pick or create an Activity while seeing my recent choices so that I can link the correct behavior to a Standard without re-entering data.
- As a user defining Standards, I want flexible cadence and minimum/unit configuration so that targets accurately reflect my plan without waiting for future upgrades.
- As a user pausing a Standard, I want to archive it into a distinct list so that history stays accessible while logging is disabled until I reactivate it.

## Specific Requirements

**Activity search and recent selector**
- Render the Activity picker as a search field that, on focus, reveals up to five most recently used Activities fetched via `useActivities` ordering.
- Replace the recents list with live search results as the user types; clearing the query restores the recents set.
- Show empty-state copy only before the user focuses the search input; once focused, always show either recents or results.
- Persist the search query for the duration of the session so a dismissed modal reopens with the last-entered query cleared.

**Inline activity creation**
- Place a “Create Activity” button/affordance adjacent to the search field; tapping opens the reusable `ActivityModal`.
- After a successful create, automatically select the newly created Activity and collapse the creation modal before dismissing the library context.
- Reuse the modal validation from the shared Zod schemas; do not fork form state or schema logic.

**Cadence builder**
- Model cadences as `{ interval: number; unit: 'day' | 'week' | 'month' | ... }` plus optional metadata (e.g., timezone, start-of-week) to align with the period calculator.
- Provide quick-pick controls for Daily, Weekly (Monday start), and Monthly that simply prefill interval/unit values.
- Offer a “Custom” control where users enter any positive integer interval and choose a unit from the supported list.
- Store cadences in Firestore with room for future weekday/rolling-window fields while still satisfying current requirements.

**Minimum + unit step**
- Auto-fill the unit from the selected Activity but allow the user to override it (freeform text capped by schema limits).
- Always require the numeric minimum; no default is inherited from the Activity.
- Validate minimum/unit using the shared Zod schema before persisting; show inline errors that match existing Activity form tone.

**Normalized summary string**
- Persist a normalized string such as “1000 calls / week” on every Standard; recompute it whenever cadence, minimum, or unit changes (including edits).
- Keep the formatting centralized (shared formatter helper) so dashboard, detail, and builder screens render the same string without reimplementing the logic.
- Store the raw fields separately so localization or formatting changes can be applied retrospectively without data loss.

**Archived state management**
- Allow users to archive/unarchive from the Standard detail or builder confirmation; archiving moves the record into an “Archived Standards” list/screen.
- When archived, display historical periods/logs read-only and show a banner/badge indicating the inactive state.
- Block any new log creation attempts for archived Standards (disable buttons, enforce guardrail in backend validation).
- Unarchiving returns the Standard to the active list without touching historical logs; recalculate period rollups immediately upon reactivation.

**Data persistence & sync**
- Store Standards under the user scope in Firestore with converter-backed models that include cadence, minimum, unit, summary string, archived flag, and timestamps.
- Ensure Firestore security rules prevent writes to archived Standards until the archive flag flips false.
- Emit analytics/logging events (create, edit, archive, unarchive) so usage can be monitored.

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**`apps/mobile/src/components/ActivityLibraryModal.tsx`**
- Already wraps `ActivityLibraryScreen` inside a modal; extend it to support the focus-triggered recents view and inline create action rather than building a new picker.
- Provides the dismissal/selection plumbing we need for the builder—reuse the `onSelectActivity` callback path.

**`apps/mobile/src/components/ActivityModal.tsx`**
- Supplies the reusable Activity creation/edit modal with Zod-driven validation, save handling, and styling; invoke it from the builder instead of duplicating forms.
- Supports an `onSelect` callback that we can use to auto-select newly created Activities in the builder flow.

**`apps/mobile/src/hooks/useActivities.ts`**
- Delivers the user-scoped Activity list, search filtering, and CRUD helpers backed by Firestore converters; extend it to expose “recently used” ordering.
- Already debounces search input and handles optimistic creation, so the builder should lean on this hook to avoid redundant Firestore queries.

**`apps/mobile/src/screens/StandardsBuilderScreen.tsx`**
- Serves as the initial scaffold for the builder UI; evolve this screen to host the two-step flow, cadence form, and archive affordances rather than starting from scratch.
- Demonstrates header/back-navigation patterns and Activity selection state handling that can be expanded.

**`packages/shared-model` schemas**
- Houses Zod schemas for `Activity` and (once updated) `Standard`; extend these to include cadence + archive fields so both mobile and backend share validation.
- The shared schemas should also export the normalized summary formatter to keep platform parity.

## Out of Scope
- Specific weekday or business-day cadence targeting, rolling windows, or “every Nth workday” logic.
- Standards templates, bulk edits, or multi-standard duplication flows.
- Collaborative standards, sharing, or multi-user visibility.
- Auto-logging or background logging automations.
- Migration or transformation of existing log records when changing cadence/unit (only regenerate summaries).
- UI for editing historical logs within the builder (handled by future logging features).
- Push notifications or reminders tied to cadences.
- Import/export of standards to external systems.





