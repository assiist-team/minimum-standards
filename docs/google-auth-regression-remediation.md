# Google Auth Regression Remediation Playbook

> **Primary objective:** restore the pre-regression sign-in behavior (single Auth screen, manual account switching works, no repeated Google consent prompts) while keeping the silent-session convenience we added earlier. Follow the steps **exactly**—most of the current breakage came from ad‑hoc edits inside the sign-in screens.

---

## 1. Snapshot the last known good state

1. Save the current working tree (`git status`); **do not** discard changes yet.
2. Identify the last build where Google sign-in behaved correctly (per user report, “yesterday or the day before”). Run:
   ```bash
   git log --since="3 days ago" -- apps/mobile/src/screens apps/mobile/src/stores apps/mobile/src/utils
   ```
3. Note the commit SHA(s) touching the auth store, sign-in screens, or Google utils. Keep them handy for diffs in later steps.

---

## 2. Remove manual auth-store overrides from UI screens

**Why:** Navigation flashes & double renders happen because `SignInScreen` and `SignUpScreen` now mutate the auth store directly, racing the global `onAuthStateChanged` listener.

**What to change:**

1. Open:
   - `apps/mobile/src/screens/SignInScreen.tsx`
   - `apps/mobile/src/screens/SignUpScreen.tsx`
2. Delete all `useAuthStore` imports/usages introduced recently (`setAuthUser`, `setAuthInitialized`, the extra `currentUser` blocks).
3. After removal, both screens should simply call the Firebase auth methods and trust the listener to update state. **Reviewer checklist:** block any PR that re-introduces direct `useAuthStore` mutations from UI components.

**Verification:**

- Temporarily add `console.log` inside `authStore.initialize`’s `onAuthStateChanged` callback to ensure it still fires once per auth change.
- Run the app, sign out, then sign back in; confirm only one Auth screen render occurs (no flicker).

---

## 3. Fix Google account switching

**Problem:** We routed interactive sign-in through `signInSilently()` and then tried to force the picker by calling `GoogleSignin.signOut()` before every tap. That combination both reused the wrong account *and* blew away the cached OAuth grant, which reintroduced the consent prompts we were trying to avoid.

**Remediation steps:**

1. In `apps/mobile/src/screens/SignInScreen.tsx`:
   - Delete the silent-sign-in fallback and any pre-emptive `GoogleSignin.signOut()` call.
   - Call `GoogleSignin.hasPlayServices` (Android) and then invoke `GoogleSignin.signIn()` directly. The native picker appears whenever multiple accounts exist, but cached scopes remain intact so Google doesn’t re-ask for permission.
   - After the Firebase credential resolves, let `authStore` drive navigation (no manual store writes).
2. Keep the silent sign-in attempt **only** inside `authStore.initialize`, guarded by `hasAttemptedSilentSignIn`, so automatic session restore happens once per app launch.
3. Mirror the same change in `SignUpScreen`.
4. Update `authStore.signOut()` so it **only** signs out from Firebase. Add a separate `clearGoogleSession()` helper inside the store for the rare cases where we truly need to drop the cached Google session (e.g., “Use a different Google account”). Regular sign-out must leave the Google grant intact to avoid re-triggering the consent dialog.

**Testing checklist:**

- Sign out via the Settings screen (which calls `authStore.signOut()`).
- Tap “Sign in with Google”; confirm the account picker appears and allows switching accounts without showing the consent dialog.
- Choose a different Google profile and verify Firebase signs into the selected user.

---

## 4. Preserve the “no repeated consent” fix

The whole point of the earlier change was: **use silent restore during startup, keep cached scopes intact, and only show UI when the user explicitly taps the Google button.**

With the updated remediation steps:

- Silent restore still happens exactly once inside `authStore.initialize`. Because we no longer clear the Google session on every tap, the cached OAuth grant survives and the user lands in the authenticated UI without touching the login screen.
- When the user taps “Sign in with Google,” we present the account picker but reuse the existing grant, so consent is only requested for new accounts or new scopes.

**Double-check:**

1. Launch the app fresh (still signed into Google). Confirm you land in the authenticated UI without touching the login screen and see a single `[AuthStore] onAuthStateChanged` log line.
2. Sign out → sign back in with the same account. You should see the picker, but only a quick account selection (no consent dialog).
3. (Optional) Call the new `clearGoogleSession()` helper, then sign in again—this path should intentionally show the consent dialog, verifying that we only wipe the grant when explicitly requested.

---

## 5. Regression tests (must be run before merging)

1. **Manual QA**
   - iOS: full sign-out/sign-in cycle, switch accounts, verify single Auth screen render.
   - Android (if feasible): ensure Play Services check still passes and account picker shows.
2. **Automated tests**
   - `cd apps/mobile && npm test -- SignInScreen`
   - `npm test -- authFlowIntegration`
   - If Jest fails with “Cannot find module `@jest/test-sequencer`,” reinstall dependencies (`npm install`) before re-running; do **not** skip the suites.
3. **Logging sanity**
   - Watch Metro/Xcode logs for:
     - `[AuthStore] onAuthStateChanged callback fired` exactly once per auth change (no duplicate initialization logs when tapping Google).
     - No warnings about missing ID tokens or null `currentUser`.

---

## 6. Deployment checklist

- ✅ All manual QA steps pass.
- ✅ Jest suites above pass.
- ✅ `npm run lint && npm run typecheck` (apps/mobile) pass.
- ✅ Commit message: `fix(mobile): restore google auth flow regressions`.
- ✅ Share this doc link + summary in the PR description so reviewers understand the rollback strategy.

---

## Appendix: Root causes & guardrails

| Issue | Root Cause | Guardrail |
| --- | --- | --- |
| Auth screen flicker | Screens wrote to auth store directly | Only the store (and its listener) own auth state; UI never calls `setUser`/`setInitialized`. |
| Forced Google account reuse | Sign-in handler forced `signInSilently()` | Buttons call `GoogleSignin.signIn()` directly; silent sign-in lives only in `authStore.initialize`. |
| Repeated Google consent prompts | We wiped the Google session on every sign-out | Default sign-out leaves Google session intact; only the dedicated `clearGoogleSession()` helper may call `GoogleSignin.signOut()`. |

Add team lint rule / code review checklist item: “Never mutate auth store outside `authStore.ts` except via provided actions.”

---

**If anything in this doc feels ambiguous, stop and ask before changing code.** This flow is extremely sensitive to race conditions—follow the steps literally. 
