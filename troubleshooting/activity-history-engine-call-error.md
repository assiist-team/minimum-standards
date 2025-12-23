# Activity History Engine `undefined.call` TypeError

## Summary
Opening Activity History can crash with:

```
[useActivityHistoryEngine] Error during catch-up: TypeError: Cannot read property 'call' of undefined
```

The stack usually points at `ActivityHistoryScreen` and repeats through the navigation wrappers.

**Status:** ⚠️ **STILL OCCURRING IN QA** - Runtime validation now surfaces clear errors, but the latest investigation shows the embedded bundle already contains the guarded helper while the crash persists. Keep following the resolution steps and diagnostics below to ensure no stale bundles remain and to trace alternate causes.

## Root Cause
The Activity History engine calls `getLatestHistoryForStandard` from `@minimum-standards/firestore-model`.  
That helper expects an object argument: `{ firestore, userId, standardId }`.  
An older JS bundle still calls it positionally (`getLatestHistoryForStandard(userId, standard.id)`), so inside the helper all destructured values are `undefined`. The helper immediately invokes Firestore bindings (`bindings.doc(firestore, ...)`), which crashes because `firestore` is undefined, leading to the `undefined.call` TypeError.

**Key insight:** Metro bundles from `apps/mobile/node_modules/@minimum-standards/firestore-model`, not directly from `packages/firestore-model`. Rebuilding the source package without reinstalling dependencies leaves the old code in `node_modules`, so Metro continues serving the stale bundle.

This persists even after "Clean Build Folder" if:
- Xcode reuses a stale `main.jsbundle`
- Metro is still serving an old bundle
- `node_modules` contains outdated versions of workspace packages

## Prevention
Runtime validation has been added to `getLatestHistoryForStandard` that will:
- Detect incorrect call signatures early (before the cryptic `undefined.call` error)
- Provide clear error messages pointing to this troubleshooting doc
- Log helpful diagnostics in `useActivityHistoryEngine` when stale bundle issues are detected

If you see an error mentioning "stale bundle" or "invalid parameter", follow the resolution steps below.

## How to Confirm
1. Generate a bundle manually and inspect the call site:
   ```bash
   cd /Users/benjaminmackenzie/Dev/minimum_standards/apps/mobile
   npx react-native bundle \
     --platform ios \
     --dev true \
     --entry-file index.js \
     --bundle-output /tmp/main.jsbundle \
     --reset-cache
   rg "getLatestHistoryForStandard" /tmp/main.jsbundle
   ```
   If you still see `getLatestHistoryForStandard(userId,` anywhere, you are running the stale code.

2. In a running Metro console, enable HMR logging (`d` → toggle Fast Refresh) and reload. If the logs do **not** mention recompiling `useActivityHistoryEngine.ts`, Metro has not picked up the change.

## Resolution

### ⚠️ CRITICAL: Embedded Bundle Issue
`MinimumStandardsMobile` is built with `FORCE_EMBEDDED_JS_BUNDLE`, so the device ignores Metro and always boots the embedded bundle. The logs will confirm this every launch:
```
[AppDelegate] FORCE_EMBEDDED_JS_BUNDLE enabled - loading embedded bundle
```

Cleaning Metro's cache or rebuilding packages alone will never fix the runtime—Xcode must regenerate the embedded bundle.

### Steps to Fix

1. **Rebuild the firestore-model package** (critical - Metro bundles from node_modules, which needs the rebuilt dist):
   ```bash
   cd /Users/benjaminmackenzie/Dev/minimum_standards/packages/firestore-model
   npm run build
   ```

2. **Reinstall dependencies in the mobile app** to update node_modules with the rebuilt package:
   ```bash
   cd /Users/benjaminmackenzie/Dev/minimum_standards/apps/mobile
   npm install
   ```

3. **Kill every Metro/packager process**:
   ```bash
   lsof -ti :8081 | xargs kill
   ```

4. **NUCLEAR OPTION - Delete ALL Xcode build artifacts**:
   ```bash
   # Delete ALL DerivedData (not just Build folder)
   rm -rf ~/Library/Developer/Xcode/DerivedData/MinimumStandardsMobile-*
   
   # Delete the app from simulator/device
   xcrun simctl uninstall booted com.minimumstandards.mobile
   # OR manually delete from device/simulator
   ```

5. **Clean Xcode project thoroughly**:
   - Open Xcode
   - Product → Clean Build Folder (Cmd+Shift+K)
   - Wait for completion
   - Close Xcode completely

6. **Start a fresh Metro with a cache reset**:
   ```bash
   cd /Users/benjaminmackenzie/Dev/minimum_standards/apps/mobile
   npx react-native start --reset-cache
   ```

7. **Regenerate the embedded JS bundle before running Xcode**:
   ```bash
   cd /Users/benjaminmackenzie/Dev/minimum_standards/apps/mobile
   npx react-native bundle \
     --platform ios \
     --dev false \
     --entry-file index.js \
     --bundle-output ios/main.jsbundle \
     --assets-dest ios \
     --reset-cache
   ```
   This overwrites `apps/mobile/ios/main.jsbundle`, which `AppDelegate` always loads in Debug builds. **Important:** The default Xcode run script (`Bundle React Native code and images`) still generates its own bundle unless you disable it. Either:
   - Set the scheme env `SKIP_BUNDLING=1` so the run script skips its copy step and the app uses the manually regenerated `ios/main.jsbundle`, **or**
   - Leave the script enabled but set `FORCE_BUNDLING=1` and add `--reset-cache` in `EXTRA_PACKAGER_ARGS` so Xcode’s script rebuilds the bundle itself (you can edit the Run Script phase to append the flag).

8. **Rebuild from scratch in Xcode**:
   - Open Xcode
   - Product → Build (Cmd+B) - wait for completion
   - Product → Run (Cmd+R)
   
   Confirm the Run Script phase is pointing at the same bundle you regenerated (or that it is disabled if you set `SKIP_BUNDLING=1`). After the build, inspect `/Users/benjaminmackenzie/Library/Developer/Xcode/DerivedData/.../Build/Products/Debug-iphoneos/MinimumStandardsMobile.app/main.jsbundle` and verify it contains the new runtime-guard strings (search for `firestore is required`). If that file still contains the old `"Expected object parameter"` message, the run script is still copying a stale bundle.

9. **Verify the fix**: Open Activity History. Check logs for:
   - Absence of `[AppDelegate] FORCE_EMBEDDED_JS_BUNDLE` message (ideal)
   - OR if present, ensure no `undefined.call` errors occur
   - Engine should log successful catch-up runs

### Alternative: Disable Embedded Bundle for Development
If this keeps happening, consider disabling `FORCE_EMBEDDED_JS_BUNDLE` during development so the app always connects to Metro's live bundle. This is typically a build configuration or environment variable in your iOS project.

### 2025-12-22 Attempt Log
- Rebuilt `packages/firestore-model`, ran `npm install` inside `apps/mobile`, killed Metro (`lsof -ti :8081 | xargs kill`), removed `~/Library/Developer/Xcode/DerivedData/MinimumStandardsMobile-*`, and relaunched Metro with `npx react-native start --reset-cache`.
- Regenerated the embedded bundle via `npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output ios/main.jsbundle --assets-dest ios --reset-cache`.
- Edited the Xcode Run Script phase (`Bundle React Native code and images`) to export `FORCE_BUNDLING=1` and append `--reset-cache` via `EXTRA_PACKAGER_ARGS`, forcing Xcode to rebuild the embedded bundle rather than copying a stale artifact.
- After Product → Clean Build Folder and a fresh build/run, logs still showed `[AppDelegate] FORCE_EMBEDDED_JS_BUNDLE enabled - loading embedded bundle`, and Activity History failed with the original crash:

```
[useActivityHistoryEngine] Error during catch-up: TypeError: Cannot read property 'call' of undefined
```

- Follow-up inspection of `/Users/benjaminmackenzie/Library/Developer/Xcode/DerivedData/.../MinimumStandardsMobile.app/main.jsbundle` confirmed the new runtime guard strings (e.g., `firestore is required`) are present, so Xcode is embedding the rebuilt helper. The positional invocation no longer exists in the bundle, so the `.call` failure must now be caused by a different path (likely a missing Firestore object being passed through the wrapper).
- Next steps: instrument `apps/mobile/src/utils/activityHistoryFirestore.ts` to log the `firestore` reference before calling `createActivityHistoryHelpers`, and verify `firebaseFirestore` initialization under React Native Firebase modular APIs. Also inspect any other bundles (e.g., cached `main.jsbundle` copies in DerivedData) that might re-export older helper versions.

### 2025-12-22 Findings
- The derived bundle already imports `getLatestHistoryForStandard` via `../utils/activityHistoryFirestore` and calls it with `{ userId, standardId }`, so no positional call sites remain.
- `getUserScopedCollections` (in `packages/firestore-model/src/collection-layout.ts`) builds a `dashboardPins` document reference via `bindings.doc(userDoc, 'preferences', 'dashboardPins')`, but `userDoc` is a `DocumentReference`, which does **not** expose `.doc` in the modular/React Native Firebase APIs. When this helper runs, `parent.doc` is `undefined`, leading to the observed `Cannot read property 'call' of undefined` crash even though the guard strings exist.
- Fix: derive the `dashboardPins` doc from a collection reference (e.g., `const preferences = bindings.collection(userDoc, 'preferences'); const dashboardPins = bindings.doc(preferences, 'dashboardPins');`) or build it directly from the root Firestore reference. After updating the helper, rebuild `@minimum-standards/firestore-model` and reinstall the mobile dependencies so Metro/Xcode pick up the corrected bindings.

## Extra Diagnostics
- If the error reappears, repeat the bundle inspection step to ensure no other file is calling the helper positionally.
- The runtime validation will now catch stale bundle issues early and log clear error messages. Check the console for messages starting with `[getLatestHistoryForStandard]` or `[useActivityHistoryEngine] STALE BUNDLE DETECTED`.
- **Critical:** Metro bundles from `apps/mobile/node_modules/@minimum-standards/firestore-model`, not directly from `packages/firestore-model`. If you rebuild the source package but don't reinstall dependencies, Metro will continue serving the old code.
- To verify the bundle contains the fix, check that `node_modules/@minimum-standards/firestore-model/dist/activity-history-helpers.js` contains the runtime validation guards before the destructuring.
- For CI/build machines, ensure the build step runs `npx react-native bundle ... --reset-cache` to avoid cached Metro artifacts.

## Implementation Notes
- Runtime validation added in `packages/firestore-model/src/activity-history-helpers.ts` to validate parameters before use
- Enhanced error handling in `apps/mobile/src/hooks/useActivityHistoryEngine.ts` to detect and log stale bundle issues
- Error messages now include references to this troubleshooting doc for quick resolution

