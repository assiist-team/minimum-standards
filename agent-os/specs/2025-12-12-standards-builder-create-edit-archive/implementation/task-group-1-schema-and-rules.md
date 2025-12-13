# Task Group 1 – Schema + Firestore foundations

## Scope
- Shared model schemas (`packages/shared-model/src/schemas.ts`, `src/standard-summary.ts`) now include cadence objects, minimum/unit overrides, `archivedAt`, and the `formatStandardSummary()` helper that normalizes preview strings.
- Firestore converters (`packages/firestore-model/src/converters.ts`) persist the extended schema and normalize timestamps so the mobile app and emulator tests agree on payload shape.
- Updated Firestore security rules (`firebase/firestore.rules`) allow standards to transition between active/archived states while blocking any mutations that keep `archivedAt` set. This matches the guardrails used by the client hooks.

## Implementation Notes
- `canWriteStandard()` only permits writes when a standard is active or when explicitly unarchiving, matching the spec requirement to “block writes when archived” without preventing the archive action itself.
- New rule-unit tests (`packages/firestore-rules-tests/firestore.rules.test.ts`) cover archiving, blocked updates while archived, and unarchive flows in addition to the existing isolation + logging checks.
- Client logic (`apps/mobile/src/hooks/useStandards.ts`) respects the same constraints by preventing log creation when `archivedAtMs` is set and by toggling `state` + `archivedAt` in lockstep with the rules.

## Verification
- `npm --prefix apps/mobile run lint`
- `npx tsc --noEmit -p apps/mobile/tsconfig.json`
- `npm --prefix apps/mobile test -- --runInBand`
- `npm --prefix packages/firestore-rules-tests test` *(fails on this host because Java is not installed—see Risks)*

## Risks & Follow-ups
- The Firebase emulator suite requires Java 17+. The local runner currently aborts with “Unable to locate a Java Runtime,” so CI/dev machines must install Java and re-run `npm --prefix packages/firestore-rules-tests test` before certifying the spec.
- Once Java is available, capture emulator output in `packages/firestore-rules-tests/firestore-debug.log` to keep the verification artifacts up to date.
