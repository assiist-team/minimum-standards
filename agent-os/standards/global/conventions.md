## General development conventions (React Native + Firebase)

> The processes below lean on the tools/environments defined in `profiles/react-firebase/standards/global/tech-stack.md`. If those tools change, keep the tech stack file in sync first.

- **Workspace layout**: Mono-repo with `apps/mobile`, `apps/functions`, and `packages/shared`. Keep `firebase.json`, `firestore.rules`, and `firestore.indexes.json` at the root.
- **Environment management**: Use `.env.local`, `.env.staging`, `.env.production` plus `react-native-config` for client runtime values. Maintain matching Firebase project aliases (`dev`, `staging`, `prod`) in `firebase use`.
- **Secrets**: Store service account keys and API secrets in 1Password or Doppler; never check them into the repo. Cloud Functions should read secrets via Firebase environment config (`firebase functions:config:set`).
- **Version control**: Feature branches follow `feature/<issue-id>-short-name`. Commit titles follow Conventional Commits (`feat:`, `fix:`).
- **Documentation**: Each feature folder contains `README.md` explaining navigation entry points, API contracts, and analytics events. Keep `docs/release-checklist.md` current.
- **Dependency policy**: Prefer React Native Community or Expo-maintained packages. Avoid adding native modules without verifying support for both iOS and Android.
- **Testing gates**: PRs must pass `npm run lint`, `npm run test`, `npm run typecheck`, relevant Cloud Function tests, and (for release branches) Detox smoke tests on CI.
- **Feature flags**: Use Firebase Remote Config for gradual rollouts; fall back to static JSON flags only for offline-critical behavior. Document each flag’s owner and sunset date.
- **Release cadence**: Weekly mobile release cadence; hotfix branches allowed only for crash regressions. Backend (Cloud Functions) deploys are continuous but require approval if touching security rules.
