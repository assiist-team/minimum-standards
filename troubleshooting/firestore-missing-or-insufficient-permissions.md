# Firestore `Missing or insufficient permissions` during downgrade testing

## Summary
During the RN 0.76.5 downgrade, Firestore listeners for `users/{uid}/preferences/dashboardPins`, `activities`, and `standards` immediately rejected with `Missing or insufficient permissions`. Authentication succeeded (user ID present), so the failures point to mismatched Firestore rules, emulator configuration drift, or server timestamps missing from client writes.

## Symptoms
- Device log spam: `FirebaseError: [code=permission-denied]: Missing or insufficient permissions` as soon as hooks such as `useActivities` or `useStandards` start listening.
- Firestore network panel shows unauthenticated requests even though the user is signed in.
- No data renders in dashboards; retrying simply replays the same error.

## Root Cause Checklist
1. **Rules mismatch** – `firebase/firestore.rules` requires `request.auth.uid == uid` plus strict timestamp validation. Any write missing `createdAt`/`updatedAt == request.time` will be rejected.
2. **Wrong environment** – The app might be pointed at production Firestore while the logged-in user only exists in the emulator (or vice versa). Check `FIREBASE_AUTH_EMULATOR_HOST` / `FIRESTORE_EMULATOR_HOST` env vars.
3. **Stale security rules deployed** – The local emulator picks up `firebase/firestore.rules`, but production may still have legacy rules.
4. **Server timestamps stripped** – If modular migration removed `firebase.firestore.FieldValue.serverTimestamp()` accidentally, the writes fail rule predicates like `isCreateWithServerTimestamps()`.

## Remediation
1. **Confirm auth state**
   - Use `firebaseAuth.currentUser?.uid` inside `apps/mobile/src/stores/authStore.ts` to log the UID before any Firestore call.
   - In the emulator UI, ensure the same UID exists under Authentication.
2. **Verify emulator vs. prod**
   - Check `.env` (or `react-native-config`) for `FIREBASE_USE_EMULATOR`. Ensure the app and backend agree.
   - If using emulators: `firebase emulators:start --import=./.firebase-data --export-on-exit` to keep data in sync.
3. **Re-run rule tests**
   - `npm --prefix packages/firestore-rules-tests test` validates the strict timestamp + key requirements in `firebase/firestore.rules`.
   - Fix any failing suites before redeploying.
4. **Inspect client writes**
   - Search for `firebaseFirestore.FieldValue.serverTimestamp()` usage and ensure every create/update still sets `createdAt` and `updatedAt` appropriately.
   - When migrating to the modular API, replace these with `serverTimestamp()` imported from `@react-native-firebase/firestore`.
5. **Deploy synchronized rules**
   - After validating locally, run `firebase deploy --only firestore:rules` (or use your CI pipeline) so prod and local match.

## Verification
- Launch the app while tailing `firebase emulators:start` output; reads/writes should succeed with `ALLOW` logs.
- In production, use the Firestore console to confirm documents create/update without permission errors.
- Automated rule tests plus `npm run test:functions` should pass.

## References
- Security rules: `firebase/firestore.rules`
- Hooks issuing reads/writes: `apps/mobile/src/hooks/*.ts`
- Auth store: `apps/mobile/src/stores/authStore.ts`
