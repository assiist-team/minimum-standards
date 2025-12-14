## Test coverage best practices (React Native + Firebase)

> Commands and tools referenced here come from `profiles/react-firebase/standards/global/tech-stack.md`. Update that doc first if we change testing frameworks or runners.

- **Prioritize critical paths**: Cover sign-up/login, sync, and purchase flows first. Supplement with regression tests only after those pass.
- **Component tests**: Use Jest + React Native Testing Library to assert rendered output and interactions; mock native modules via `@react-native-community/cli` auto-mock or manual mocks.
- **State + hooks**: Test shared hooks and Zustand stores in isolation—mock React Query responses rather than hitting Firestore.
- **E2E sanity**: Maintain a small Detox suite (happy-path auth + navigation + write/read) that runs on CI for release branches.
- **Backend functions**: Use Jest + `firebase-functions-test` against the Emulator for HTTP and trigger functions. Keep each suite hermetic by seeding emulator data per test.
- **Emulator suite**: Run `firebase emulators:start --only firestore,auth,functions,storage` for integration tests so no real data is touched.
- **Lint & type gate**: `npm run lint` and `npm run typecheck` must pass before tests run; this catches most issues earlier and keeps suites fast.
