# Migrate off deprecated React Native Firebase namespaced APIs

## Summary
React Native Firebase v23 warns every time we call namespaced helpers such as `firebaseAuth.signOut()` or `firebaseFirestore.collection('foo')`. The v22 release line removed these entry points entirely, so the downgrade exposed a flood of warnings in both Debug and Release builds. We must switch to the modular API that mirrors the Web SDK.

## Symptoms
- Console spam: `⚠️ [firebase] The "collection" namespace is deprecated... use the modular API`. Similar messages appear for `doc`, `signOut`, `onAuthStateChanged`, etc.
- TypeScript still compiles because the deprecated methods remain in the type definitions for backwards compatibility.
- Release builds see noticeable performance regressions because the deprecated wrappers add runtime indirection and cannot be tree-shaken.

## Root Cause
- Application code imports singleton handles from `apps/mobile/src/firebase/firebaseApp.ts` and then chains deprecated methods:
  ```ts
  const logsRef = firebaseFirestore
    .collection('users')
    .doc(user.uid)
    .collection('periodLogs');
  ```
- Modular React Native Firebase expects callers to import functions such as `collection`, `doc`, `query`, `where`, etc., and pass the Firestore instance explicitly: `collection(firebaseFirestore, 'users', user.uid, 'periodLogs')`.
- Auth usage (e.g., `firebaseAuth.signOut()`) similarly needs to move to helpers like `signOut(firebaseAuth)`.

## Remediation
1. **Inventory deprecated calls**
   - Search for `.collection(`, `.doc(`, `.where(`, `.orderBy(`, `.signOut(` across `apps/mobile/src`.
   - Prioritize shared hooks (`useStandards`, `useActivities`, `usePeriodLogs`, `useStandardHistory`, `useActiveStandardsDashboard`) plus the new `firebase/` folder.
2. **Adopt modular helpers**
   - Update imports at the top of each file, e.g.:
     ```ts
     import { collection, doc, query, where } from '@react-native-firebase/firestore';
     import { onAuthStateChanged, signOut } from '@react-native-firebase/auth';
     ```
   - Replace chained calls with modular equivalents:
     ```ts
     const logsRef = collection(firebaseFirestore, 'users', user.uid, 'periodLogs');
     const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => { ... });
     await signOut(firebaseAuth);
     ```
3. **Share helper builders when useful**
   - Create small helpers in `firebase/collections.ts` (e.g., `userStandardsCollection(userId: string)`), so the modular boilerplate stays centralized.
4. **Regenerate types**
   - Run `npm run typecheck` to catch missed imports or incorrect helper signatures.
5. **Remove deprecated usage from tests**
   - Update Jest mocks (`apps/mobile/test/mocks/reactNativeFirebaseAuth.js`, etc.) to mock the modular functions instead of namespaced objects.

## Verification
- `npm run lint && npm run typecheck` should pass with no deprecated usage warnings.
- Launch the app; the yellow-box deprecation warnings from React Native Firebase should disappear.
- Smoke-test authentication (sign-in, sign-out) and Firestore CRUD flows to ensure the modular helpers behave identically.

## References
- `apps/mobile/src/firebase/firebaseApp.ts`
- Hooks using Firestore: `apps/mobile/src/hooks/`
- Auth store: `apps/mobile/src/stores/authStore.ts`
- RN Firebase migration guide: https://rnfirebase.io/migrating-to-v22


