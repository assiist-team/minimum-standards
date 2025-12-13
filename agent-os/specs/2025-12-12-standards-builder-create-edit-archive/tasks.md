# Task Breakdown: Standards builder (create/edit + archive)

## Overview
Total Tasks: 25

## Task List

### Shared Models & Rules

#### Task Group 1: Schema + Firestore foundations  
**Dependencies:** None

- [x] 1.0 Complete shared schema + rules updates
  - [x] 1.1 Write 3-5 focused unit tests covering cadence shape parsing, summary regeneration, and archive flag validation in `packages/shared-model`.
  - [x] 1.2 Extend the Standard Zod schema + TypeScript types with `{interval, unit}` cadence, minimum/unit overrides, normalized summary field, and `archivedAt`.
  - [x] 1.3 Implement a reusable `formatStandardSummary()` helper (shared-model) that produces strings like “1000 calls / week” and hook it into converters.
- [⚠️] 1.4 Update Firestore converters + security rules to persist cadence fields, block writes when `archivedAt` is set, and store timestamps consistently.
  - [x] 1.5 Run only the tests from 1.1 to verify schema + converter behavior.

**Acceptance Criteria:**
- Shared schema compiles with new fields and helper exposed.
- Firestore rules reject writes to archived Standards.
- Tests from 1.1 pass.

### Mobile Data Layer

#### Task Group 2: Hooks + state management  
**Dependencies:** Task Group 1

- [x] 2.0 Complete mobile data layer updates
  - [x] 2.1 Write 2-6 focused hook tests (or Jest mocks) covering recent-activity ordering, search override behavior, and summary persistence.
  - [x] 2.2 Extend `useActivities` to expose five most recent Activities (by `updatedAtMs`) plus a method to fetch/display them when the search field is focused.
  - [x] 2.3 Create a Standards builder store (Zustand or screen-level reducer) that tracks selected Activity, cadence object, minimum, unit override, archive toggle, and summary preview.
  - [x] 2.4 Implement a cadence utility that maps quick-pick buttons to `{interval, unit}` presets and supports custom interval/unit entry with validation.
  - [x] 2.5 Integrate the normalized summary helper so the builder regenerates the preview and payload any time cadence/minimum/unit change.
  - [x] 2.6 Run only the tests from 2.1 to confirm hook/store behavior.

**Acceptance Criteria:**
- Hook exposes recents + search results without extra Firestore reads.
- Builder state persists through the two-step flow and outputs a valid payload for Firestore.
- Tests from 2.1 pass.

### Mobile UI & Interaction

#### Task Group 3: Standards builder screens  
**Dependencies:** Task Group 2

- [x] 3.0 Complete Standards builder UI
  - [x] 3.1 Write 3-6 component tests (RNTL) covering focus-triggered recents, search-to-result transition, cadence preset selection, and archive toggle state.
  - [x] 3.2 Update `ActivityLibraryModal` to show recents once the search input gains focus, fall back to “no recents yet” copy, and restore recents when the query clears.
  - [x] 3.3 Add an inline “Create Activity” affordance beside the search bar that opens `ActivityModal`, auto-selects the new Activity on save, and dismisses nested modals cleanly.
  - [x] 3.4 Build the cadence step UI with quick-pick chips, custom interval/unit inputs, validation messaging, and a live summary preview string.
  - [x] 3.5 Implement the minimum + unit form with auto-filled unit, override input, numeric keypad configuration, and inline validation errors.
  - [x] 3.6 Display the normalized summary string in confirmation screens and any list previews to ensure parity with dashboard formatting.
  - [x] 3.7 Wire archive/unarchive controls into the builder confirmation and detail surfaces, showing badges/banners for inactive Standards.
  - [x] 3.8 Run only the tests from 3.1 to verify UI flows.

**Acceptance Criteria:**
- Activity picker UX matches spec (focus reveals recents, typing shows results, inline create works).
- Cadence + minimum/unit forms enforce valid input and update the summary preview in real time.
- Archive affordances appear and behave as described.
- Tests from 3.1 pass.

### Archived Experience & QA

#### Task Group 4: Archived lists, logging guardrails, analytics  
**Dependencies:** Task Groups 2-3

- [x] 4.0 Complete archive & QA work
  - [x] 4.1 Write 2-5 integration/e2e tests (Detox or high-level Jest) covering archive list visibility, log blocking, and unarchive flow.
  - [x] 4.2 Build the “Archived Standards” list/screen with read-only period history, using shared components for list rows and badges.
  - [x] 4.3 Enforce front-end guardrails so log buttons/actions are disabled for archived Standards, including global log entry points.
  - [x] 4.4 Add backend/client validation to prevent log creation API calls when `archivedAt` is set; surface neutral error copy if somehow attempted.
  - [x] 4.5 Instrument analytics events for create/edit/archive/unarchive along with cadence/minimum metadata (non-PII).
  - [x] 4.6 Run only the tests from 4.1 plus sanity checks from earlier groups to ensure archived flows remain stable.

**Acceptance Criteria:**
- Archived Standards render in their own list with read-only details.
- Logging into archived Standards is impossible from both UI and API layers.
- Analytics events fire with correct payloads.
- Tests from 4.1 (and rerun subsets) pass.

## Execution Order
1. Shared Models & Rules (Task Group 1)
2. Mobile Data Layer (Task Group 2)
3. Mobile UI & Interaction (Task Group 3)
4. Archived Experience & QA (Task Group 4)
