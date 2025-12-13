# Task Group 2 – Mobile data layer

## Scope
- `apps/mobile/src/hooks/useActivities.ts` exposes CRUD helpers, substring search, debounced queries, five recent activities (by `updatedAtMs`), and optimistic updates that keep the UI responsive while Firestore writes settle.
- `apps/mobile/src/stores/standardsBuilderStore.ts` centralizes builder state (selected activity, cadence object, minimum, unit override, archive toggle, and summary preview) so screens can share a single source of truth.
- `apps/mobile/src/hooks/useStandards.ts` handles Standards reads/writes, plus guardrails that prevent log creation for archived entries and surface reusable helpers such as `canLogStandard`.

## Implementation Notes
- The recents work relies on `recentActivities` memoization plus the `hasFocusedSearch` flag inside `ActivityLibraryScreen`, preventing extra Firestore reads when revealing the “recent picks” rail.
- `cadenceUtils.ts` codifies preset buttons + validation rules. The builder store uses `formatStandardSummary()` to regenerate the preview payload whenever cadence or minimum values change.
- Hook tests in `apps/mobile/src/hooks/__tests__` mock React Native Firebase modules to assert ordering, search override behavior, optimistic CRUD paths, and that the builder store persists state transitions.

## Verification
- `npm --prefix apps/mobile run lint`
- `npx tsc --noEmit -p apps/mobile/tsconfig.json`
- `npm --prefix apps/mobile test -- --runInBand`

## Risks & Follow-ups
- All Firebase mocks now ship from `apps/mobile/test/mocks`, so any new hook that touches Firebase must either reuse those stubs or extend them; otherwise Jest will regress with the prior ESM import error.
- Keep the store tests (`apps/mobile/src/stores/__tests__/standardsBuilderStore.test.ts`) updated when introducing new builder fields so summary generation and payload validation stay covered.
