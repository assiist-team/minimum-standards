# Task Group 3 – Standards builder UI

## Scope
- `apps/mobile/src/screens/StandardsBuilderScreen.tsx` implements the three-step builder (activity selection, cadence presets/custom entry, minimum/unit override) plus archive toggles, analytics instrumentation, and the summary preview.
- `apps/mobile/src/components/ActivityLibraryModal.tsx` and `ActivityModal.tsx` provide the picker + inline create affordance with validation, optimistic saves, and builder-friendly callbacks.
- `apps/mobile/src/screens/ActivityLibraryScreen.tsx` powers the standalone experience used by the builder, including the focus-triggered recents rail, undo snackbar, and destructive controls.

## Implementation Notes
- Cadence presets are derived from `CADENCE_PRESETS`, while custom cadence inputs reuse `validateCadence()` to ensure the builder never emits invalid intervals.
- Inline archive controls reuse the builder store so archived Standards emit the correct payloads (`state`, `archivedAt`) for Firestore rules.
- React Native Testing Library suites (`apps/mobile/src/screens/__tests__/StandardsBuilderScreen.test.tsx`, `ActivityLibraryScreen.test.tsx`) cover focus behavior, preset selection, summary rendering, and archive toggles.

## Verification
- `npm --prefix apps/mobile run lint`
- `npx tsc --noEmit -p apps/mobile/tsconfig.json`
- `npm --prefix apps/mobile test -- --runInBand`

## Risks & Follow-ups
- Any new inline styles should be promoted to `StyleSheet.create` entries to keep `react-native/no-inline-styles` satisfied—this lint rule blocks merges for visual tweaks.
- Builder analytics currently log to the console through `trackStandardEvent()`. When the real analytics provider arrives, swap the shim inside `apps/mobile/src/utils/analytics.ts` without changing the call sites.
