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
3. After removal, both screens should simply call the Firebase auth methods and trust the listener to update state.

**Verification:**

- Temporarily add `console.log` inside `authStore.initialize`’s `onAuthStateChanged` callback to ensure it still fires once per auth change.
- Run the app, sign out, then sign back in; confirm only one Auth screen render occurs (no flicker).

---

## 3. Fix Google account switching

**Problem:** `handleGoogleSignIn` now forces `signInSilently()`, so taps on “Sign in with Google” reuse the cached account and never present the selector.

**Remediation steps:**

1. In `apps/mobile/src/screens/SignInScreen.tsx`:
   - Remove the silent-first block inside `handleGoogleSignIn`. Replace with:
     ```ts
     await GoogleSignin.signOut().catch(() => {/* ignore */});
     const signInResult = await GoogleSignin.signIn();
     ```
     This guarantees the account picker shows and lets users switch.
2. Keep the silent sign-in attempt **only** inside `authStore.initialize` (already there) so sessions restore automatically on app launch without prompting.
3. Mirror the same change in `SignUpScreen` (Google sign-up handler).

**Testing checklist:**

- Sign out.
- Tap “Sign in with Google”; confirm the account picker appears and allows switching accounts.
- Choose a different Google profile and verify Firebase signs into the selected user.

---

## 4. Preserve the “no repeated consent” fix

The original request was to avoid the Google consent prompt appearing every single time. With the changes above:

- Silent restore still happens during app startup (Step 3 keeps `authStore` logic intact).
- When the user explicitly taps the Google button, we intentionally show the account picker so they can switch accounts. Consent won’t reappear unless the scope changed or the account is new.

**Double-check:**

1. Launch the app fresh (still signed into Google). Confirm you land in the authenticated UI without touching the login screen.
2. Sign out → sign back in with the same account. You should see the picker, but only a quick account selection (no consent dialog).

---

## 5. Regression tests (must be run before merging)

1. **Manual QA**
   - iOS: full sign-out/sign-in cycle, switch accounts, verify single Auth screen render.
   - Android (if feasible): ensure Play Services check still passes and account picker shows.
2. **Automated tests**
   - `cd apps/mobile && npm test -- SignInScreen`
   - `npm test -- authFlowIntegration`
3. **Logging sanity**
   - Watch Metro/Xcode logs for:
     - `[AuthStore] onAuthStateChanged callback fired` exactly once per auth change.
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
| Auth screen flicker | Screens wrote to auth store directly | Only the store (and its listener) own auth state. |
| Forced Google account reuse | Sign-in handler forced `signInSilently()` | When a user taps the button, always show the account picker; use silent sign-in only during app bootstrap. |

Add team lint rule / code review checklist item: “Never mutate auth store outside `authStore.ts` except via provided actions.”

---

**If anything in this doc feels ambiguous, stop and ask before changing code.** This flow is extremely sensitive to race conditions—follow the steps literally. 
