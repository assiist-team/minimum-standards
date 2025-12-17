# Downgrade Plan: React Native 0.83.0 -> 0.76.5

**Objective:** Downgrade React Native to restore full stability with the Old Architecture (Paper), resolving the `RCTEventEmitter` crash.

---

## Issue Log

### 2024-12-16: `-[RCTView setColor:]` crash + blank screen
(Resolved by downgrading navigation libs)

### 2024-12-17: `RNSScreenStackHeaderConfig setHide` crash
**Diagnosis:** `react-native-screens` compiled with Fabric (New Arch) despite Podfile settings, causing selector mismatch (`setShow` vs `setHide`).
**Fix:** Explicitly set `ENV['RCT_NEW_ARCH_ENABLED'] = '0'` in Podfile and scrubbed build settings.

### 2024-12-17: `hermes-engine` Command PhaseScriptExecution failed
**Diagnosis:** The `hermes-engine` pod includes a build phase script "Replace Hermes for the right configuration" that executes a Node.js script. This script was failing in the Xcode build environment, likely due to environment variable issues or `node` path resolution, causing "Command PhaseScriptExecution failed".
**Fix:**
1. Verified that both Debug and Release tarballs for Hermes 0.76.5 are present in `Pods/hermes-engine-artifacts`.
2. Verified `node` is available at `/opt/homebrew/bin/node` and functional.
3. **Fix:** `Podfile` now injects `export NODE_BINARY=...` into the Hermes script phase during `post_install`, so the script always runs with a valid `NODE_BINARY`. Re-ran `pod install` to apply the change.
4. (Optional) If building for Release, the script *should* work as long as Metro is reachable or `FORCE_EMBEDDED_JS_BUNDLE` remains enabled.

### 2024-12-17: App boots but Metro socket/JS warnings appear
**Observed run (real device, Debug config w/ embedded bundle, Metro not running):**
* Xcode emits `warning: ... empty dSYM file detected` (arm64 app binary lacks debug symbols because we're embedding the release JS bundle). Also warns `UIScene lifecycle will soon be required`.
* App launches with `FORCE_EMBEDDED_JS_BUNDLE` since Metro (ports 8097/8081) refused connections. Requiring unknown module `undefined` is logged once during startup but the app recovers.
* RN Firebase prints numerous **deprecation warnings** for namespaced APIs (`collection`, `doc`, `signOut`, etc.) indicating we must migrate to the modular API surface before v22.
* `Unrecognized font family 'Material Icons'` repeats because the `react-native-vector-icons` font assets are not bundled/linked on iOS after the downgrade reset.
* Firestore listeners fail with `Missing or insufficient permissions` for user collections (`preferences/dashboardPins`, `standards`, `activities`) suggesting auth state is valid but Firestore security rules or emulator config deny access in the current environment.
* React Navigation warns about duplicate screen names (`Main > MainTabs > Settings` nested) which will cause confusing behavior.

**Conclusion:** The core crash is resolved—Paper bridge boots, Google Sign-In works, and dismissing the Metro error leaves the app interactive—but we still have serious warning/noise to fix before declaring the downgrade stable.

**Pending work from this run (see individual playbooks):**
1. [Restore Metro-driven Debug builds](./metro-debug-builds-stuck-on-embedded-bundle.md) so we can stop forcing embedded bundles.
2. [Eliminate the `Requiring unknown module "undefined"` warning](./requiring-unknown-module-undefined.md) before it becomes a fatal Release crash.
3. [Re-link the Material Icons font assets](./material-icons-font-missing-ios.md) so tab icons stop erroring.
4. [Migrate RN Firebase usage away from deprecated namespaced APIs](./rnfirebase-namespaced-api-migration.md).
5. [Resolve Firestore `permission-denied` errors](./firestore-missing-or-insufficient-permissions.md) by aligning environments/rules.
6. [Rename nested `Settings` routes to unique identifiers](./react-navigation-duplicate-settings-screens.md) to silence React Navigation warnings.

### 2024-12-17: Release build → blank screen + fatal `unknown module "undefined"`
**Observed run (Release scheme on device, embedded bundle):**
* Same `UIScene lifecycle will soon be required` warning appears up front.
* App uses `FORCE_EMBEDDED_JS_BUNDLE` path and prints the Crashlytics / Firebase Messaging swizzle logs as expected.
* Google Sign-In + auth init sequence mirrors Debug run (user detected, listener registered).
* A flood of RN Firebase deprecation warnings (`collection`, `doc`, `onAuthStateChanged`, etc.) still appear, as well as repeated `Unrecognized font family 'Material Icons'`.
* When `SyncStatusBanner` mounts, Hermes throws `Error: Requiring unknown module "undefined"` which now **crashes Release builds** (no LogBox, fatal exception bubbled to native). Stack trace shows `getOptionalNetInfo` inside `SyncStatusBanner`.

**Impact:** Release builds currently unusable; SyncStatusBanner (or a dependency it imports) requires a module that no longer exists after the downgrade. Debug mode survives because LogBox swallows it, but Release terminates.

**Additional pending items (Release-specific):**
7. [Trace `getOptionalNetInfo` requiring module \"undefined\"](./requiring-unknown-module-undefined.md) and make Release builds stable again.
8. Once the module issue is fixed, re-test Release to ensure no remaining fatal JS exceptions.

---

## 1. Package Updates (✅ Done)
*   [x] Core React Native: 0.76.5
*   [x] React: 18.3.1
*   [x] Navigation libs: v6.x
*   [x] `react-native-screens`: ~3.35.0

## 2. Configuration Reset (✅ Done)
*   [x] `apps/mobile/ios/Podfile`: Standard 0.76 setup, `fabric_enabled => false`, `RCT_NEW_ARCH_ENABLED=0`.
*   [x] `apps/mobile/android/gradle.properties`: `newArchEnabled=false`.

## 3. Clean Install (✅ Done)
*   [x] `npm install`
*   [x] `pod install` (regenerated Pods with correct architecture flags).

## 4. Verification
*   [ ] Build iOS app.
    *   *If `hermes-engine` error persists:* check `Report Navigator` in Xcode for the specific error in "Run Script" phase of `hermes-engine`.
*   [ ] Confirm app launches without `RCTEventEmitter` crash.
*   [ ] Confirm navigation works (no `setColor:`/`setHide:` crash).

---

**Why this works:** 0.76.5 is the last stable release before the aggressive Fabric enforcement. It allows us to legally run the "Legacy Bridge" code you already have. The v6.x navigation libraries are fully compatible with RN 0.76's Paper architecture.
