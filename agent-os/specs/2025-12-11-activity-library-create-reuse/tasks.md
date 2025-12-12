# Task Breakdown: Activity Library (create + reuse)

## Overview
Total Tasks: 31

## Task List

### Shared Domain & Validation

#### Task Group 1: Unit normalization + shared types
**Dependencies:** Spec + existing shared-model packages

- [ ] 1.0 Complete shared domain updates
  - [ ] 1.1 Write 2-4 focused unit tests around pluralization helpers and unit validation (happy path, blank, already plural, irregular plural).
  - [ ] 1.2 Add a reusable `normalizeUnitToPlural` utility (wrapping the `pluralize` package) in `packages/shared-model` with clear typing.
  - [ ] 1.3 Enforce normalization inside shared Zod schema refinements or helper so UI/Firestore callers share the rule (e.g., lowercasing, length guard).
  - [ ] 1.4 Update Firestore converters / serializers to ensure `unit` persists in normalized plural form and expose helpers for callers (no drift).
  - [ ] 1.5 Run only the tests from 1.1 to verify normalization logic.

**Acceptance Criteria:**
- Normalization helper auto-pluralizes singular input and preserves plural input without duplication.
- Shared schemas/converters reject blank or >40-char units before hitting Firestore rules.
- Tests document expectations for singular, plural, and irregular inputs.

### Data Access Layer

#### Task Group 2: Firestore hook + optimistic cache
**Dependencies:** Task Group 1

- [ ] 2.0 Complete Firestore data layer
  - [ ] 2.1 Write 3-5 focused hook tests (mock Firestore) covering initial load, substring search filtering, optimistic create/edit/delete rollback.
  - [ ] 2.2 Implement `useActivities` (or equivalent) hook that subscribes to `/users/{uid}/activities`, filters out soft-deleted docs, and exposes loading/error states with offline persistence.
  - [ ] 2.3 Build client-side search utilities with ~300ms debounce and `name.toLowerCase().includes(query.toLowerCase())` substring logic.
  - [ ] 2.4 Add optimistic mutation helpers (create/edit/delete) that queue writes, surface inline errors, and resync after failures.
  - [ ] 2.5 Run only the tests from 2.1 to validate the hook behavior.

**Acceptance Criteria:**
- Hook consumers receive sorted activity lists, derived loading state, and live updates offline/online.
- Substring search works locally without extra Firestore indexes.
- Optimistic writes resolve correctly and roll back on failure.

### Reusable Modal & Form Logic

#### Task Group 3: Add/Edit Activity modal
**Dependencies:** Task Group 2

- [ ] 3.0 Complete modal + form system
  - [ ] 3.1 Write 2-5 focused component tests covering validation errors, successful submit, and modal close callbacks.
  - [ ] 3.2 Implement the modal UI with fields (name, unit, input type), inline validation, disabled submit during pending, and error surfacing.
  - [ ] 3.3 Integrate normalization + optimistic mutations so save operations normalize units, invoke hook helpers, and auto-select the new activity when invoked from the builder context.
  - [ ] 3.4 Run only the tests from 3.1 to confirm modal behaviors.

**Acceptance Criteria:**
- Modal works for both create and edit paths with shared component props.
- Validation copies shared schema limits (name ≤120, unit ≤40) and blocks submission until satisfied.
- Builder context receives the newly created Activity ID immediately after success.

### Activity Library Screen

#### Task Group 4: Standalone library UI
**Dependencies:** Task Group 3

- [ ] 4.0 Complete Activity Library screen
  - [ ] 4.1 Write 2-5 UI tests (RNTL/Detox) covering search filtering, skeleton display, and edit/delete affordances.
  - [ ] 4.2 Implement the list layout with pinned search bar, alphabetical default sorting, skeleton/loading state, and virtualized list for large sets.
  - [ ] 4.3 Add per-row actions (edit, delete) with confirm dialogs, undo snackbars for delete, and ensure builder entry hides destructive controls.
  - [ ] 4.4 Run only the tests from 4.1 to validate UI flows.

**Acceptance Criteria:**
- Screen renders empty libraries without special copy yet still shows add button.
- Search input filters via substring logic, updating results in real time.
- Edit/delete actions mutate data through hook helpers and respect optimistic state.

### Standards Builder Integration

#### Task Group 5: Builder entry point + dismissal
**Dependencies:** Task Group 4

- [ ] 5.0 Complete builder integration
  - [ ] 5.1 Write 2-4 integration tests ensuring selecting or creating an activity returns to the builder with the chosen activity set.
  - [ ] 5.2 Embed the Activity Library entry (modal or navigation push) inside Standards Builder step 1, sharing the same components built above.
  - [ ] 5.3 Ensure selection and creation flows dismiss the library, update builder form state, and respect navigation/back handling on both iOS/Android.
  - [ ] 5.4 Run only the tests from 5.1 to confirm integration behavior.

**Acceptance Criteria:**
- Builder step shows current activity selection and updates instantly after library actions.
- Back navigation works predictably (modal closes, builder remains intact).
- No duplicate logic between builder and standalone screen.

### Testing & Gap Analysis

#### Task Group 6: Feature-level verification
**Dependencies:** Task Groups 1-5

- [ ] 6.0 Complete feature testing pass
  - [ ] 6.1 Review tests from Task Groups 1-5 to catalog existing coverage.
  - [ ] 6.2 Add up to 10 high-value integration/E2E tests (e.g., create activity offline → sync, delete undo, substring search regression).
  - [ ] 6.3 Run only the combined feature-specific suites (tests from 1.1, 2.1, 3.1, 4.1, 5.1, and 6.2) to verify the end-to-end flow.

**Acceptance Criteria:**
- Feature-critical workflows (create/edit/delete/search/select) have automated coverage.
- Offline + optimistic scenarios verified at least once.
- No more than 10 additional tests added in this phase.

## Execution Order
1. Shared Domain & Validation (Task Group 1)
2. Firestore hook + optimistic cache (Task Group 2)
3. Add/Edit Activity modal (Task Group 3)
4. Activity Library screen (Task Group 4)
5. Standards Builder integration (Task Group 5)
6. Feature-level verification (Task Group 6)
