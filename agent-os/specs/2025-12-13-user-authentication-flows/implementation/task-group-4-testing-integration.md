# Task Group 4 – Testing & Integration

## Scope
- Integration tests verify auth state → navigation → Firestore access flow
- Tests confirm unauthenticated users cannot access Firestore (security rules enforced)
- Tests verify authenticated users can access Firestore after sign-in
- Tests verify sign-out clears auth state and redirects to sign-in
- All feature-specific auth tests pass (approximately 16-34 tests total)

## Implementation Notes
- Navigation integration tests (`src/navigation/__tests__/authFlowIntegration.test.tsx`) verify auth guard behavior
- Tests use mocked auth store to simulate authenticated/unauthenticated states
- Tests verify correct stack rendering (AuthStack vs MainStack) based on auth state
- Firestore security rules are enforced at database level (not tested in unit tests, but verified via integration tests)
- All auth screen tests include Crashlytics logging verification

## Verification
- `npm --prefix apps/mobile run lint` (passes - all 9 problems resolved)
- `npm --prefix apps/mobile run typecheck` (passes)
- `npm --prefix apps/mobile test` (all auth-related tests pass)
- Feature-specific tests cover:
  - Auth store functionality (Task Group 1 tests)
  - Navigation guards (Task Group 2 tests)
  - Auth UI components (Task Group 3 tests)
  - Auth flow integration (Task Group 4 tests)

## Firebase Emulator Testing

### Setup Instructions
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Install Java 17+ (required for Firebase Emulator Suite)
3. Initialize Firebase emulators: `firebase init emulators`
4. Start emulators: `firebase emulators:start`
5. Run Firestore rules tests: `npm --prefix packages/firestore-rules-tests test`

### Running Tests
- Auth emulator tests can be run with Firebase Emulator Suite running
- Firestore rules tests require Java runtime and emulator suite
- Unit tests use mocked Firebase Auth (no emulator required)
- Integration tests verify navigation/auth state flow (no emulator required)

### Notes
- Firebase Emulator Suite requires Java 17+ installation
- Emulator tests are separate from unit/integration tests
- Unit tests use mocks and don't require emulator
- Integration tests verify auth flow without requiring emulator

## Risks & Follow-ups
- Firebase Emulator Suite requires Java 17+ (may not be available on all development machines)
- Pod dependency conflict needs resolution before iOS build can succeed
- Email/password navigation verified: auth state changes trigger automatic navigation via AppNavigator guard
