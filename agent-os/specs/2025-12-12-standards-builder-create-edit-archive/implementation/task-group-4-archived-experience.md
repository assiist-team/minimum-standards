# Task Group 4 – Archived experience & QA

## Scope
- `apps/mobile/src/screens/ArchivedStandardsScreen.tsx` lists archived Standards with read-only details, log-disabled callouts, and an explicit unarchive action wired into `useStandards()`.
- `apps/mobile/src/hooks/useStandards.ts` blocks log creation against archived Standards (`canLogStandard` check) and ensures archive/unarchive toggles update both `state` and `archivedAt`.
- Global analytics coverage (create/edit/archive/unarchive/toggle) flows through `apps/mobile/src/utils/analytics.ts`, giving us predictable payloads ahead of the real analytics provider.

## Implementation Notes
- `ActivityLibraryScreen` and shared entry points call `trackStandardEvent()` when toggling archive state so we capture cadence/minimum context alongside the action.
- Firestore security rules and converter helpers are aligned with these guardrails—any attempt to create an activity log for an archived Standard is rejected server-side and client-side.
- Archived list RNTL tests (`apps/mobile/src/screens/__tests__/ArchivedStandardsScreen.test.tsx`) assert that the badge, disabled button, and unarchive callback render as expected.

## Verification
- `npm --prefix apps/mobile run lint`
- `npx tsc --noEmit -p apps/mobile/tsconfig.json`
- `npm --prefix apps/mobile test -- --runInBand`
- `npm --prefix packages/firestore-rules-tests test` *(blocked until Java 17+ is installed locally)*

## Risks & Follow-ups
- The analytics shim currently logs to the console; once a backend provider is ready we should replace the shim but preserve the event names/payload shape referenced throughout the UI.
- Re-run the Firebase emulator suite after Java is available to capture regression coverage for log blocking + unarchive behavior.
