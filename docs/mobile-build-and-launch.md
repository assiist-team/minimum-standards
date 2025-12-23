# MinimumStandardsMobile – Build & Launch Playbook

_Last updated: 2025‑12‑23_

This document captures the full end‑to‑end workflow for rebuilding, bundling, and launching the React Native iOS app inside the `minimum_standards` monorepo. Follow these steps whenever you need a clean rebuild, are chasing bundle drift, or are preparing a release build.

---

## ⚠️ Non‑negotiable Workspace Rule

**If you touch anything under `packages/*`, you _must_ do two things before expecting Metro/Xcode to see the change:**

1. Inside that package: `npm run build` (writes the new code to its `dist/` folder).
2. Inside `apps/mobile`: `npm install` (refreshes `apps/mobile/node_modules/@minimum-standards/...` with the new dist files).

Metro and the Xcode bundler only read the compiled files living under `apps/mobile/node_modules`. Skipping either step leaves those files untouched, so you’ll keep bundling stale code no matter how many caches you blow away. Keep this rule in mind whenever you edit shared packages—the rest of the steps assume you’ve done it.

---

## 1. Architecture Overview

- **Repo layout**
  - `packages/firestore-model`: shared Firestore helpers compiled to `dist/` and published via npm workspaces.
  - `apps/mobile`: React Native client that consumes the workspace packages via `node_modules/@minimum-standards/*`.
  - `apps/mobile/ios/MinimumStandardsMobile.xcworkspace`: Xcode project that builds the iOS app and always embeds a JS bundle.

- **Embedded bundle policy**
  - `AppDelegate` has `FORCE_EMBEDDED_JS_BUNDLE` enabled in all debug builds, so the app ignores Metro at runtime and loads `ios/main.jsbundle` (or the copy Xcode places into `DerivedData/.../MinimumStandardsMobile.app/main.jsbundle`).
  - The default Xcode **“Bundle React Native code and images”** run script will rebuild and copy its own bundle unless you:
    - Set `SKIP_BUNDLING=1` on the scheme (recommended during day‑to‑day dev), **or**
    - Export `FORCE_BUNDLING=1` and append `--reset-cache` to `EXTRA_PACKAGER_ARGS` inside the script so it intentionally re-bundles with a clean Metro cache (current repo default).

Keep this in mind: if the embedded bundle step isn’t explicitly controlled, any JS change requires a full Xcode rebuild to take effect, and stale bundles are very easy to ship.

---

## 2. Standard “Clean & Rebuild” Procedure

Run these steps whenever you need to guarantee that the iOS binary contains the latest JavaScript from the monorepo.

1. **Rebuild workspace packages**
   ```bash
   cd /Users/benjaminmackenzie/Dev/minimum_standards/packages/firestore-model
   npm run build
   ```

2. **Refresh mobile `node_modules` so Metro sees the new dist output**
   ```bash
   cd /Users/benjaminmackenzie/Dev/minimum_standards/apps/mobile
   npm install
   ```

3. **Stop every Metro/packager**
   ```bash
   lsof -ti :8081 | xargs kill  # ok if it prints nothing
   ```

4. **Purge Xcode artifacts + uninstall the app**
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData/MinimumStandardsMobile-*
   xcrun simctl uninstall booted com.minimumstandards.mobile  # boot a simulator first if needed
   ```

5. **Start Metro with a cache reset**
   ```bash
   cd /Users/benjaminmackenzie/Dev/minimum_standards/apps/mobile
   npx react-native start --reset-cache
   ```

6. **Regenerate the embedded bundle (always, because of FORCE_EMBEDDED_JS_BUNDLE)**
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

7. **Xcode clean & rebuild**
   - Open `MinimumStandardsMobile.xcworkspace`.
   - Ensure either:
     - Scheme Env Var `SKIP_BUNDLING=1`, **or**
     - Run script exports `FORCE_BUNDLING=1` and sets `EXTRA_PACKAGER_ARGS="--reset-cache …"`.
   - Product → **Clean Build Folder** (Cmd + Shift + K), then quit and reopen Xcode.
   - Product → **Build** (Cmd + B), then Product → **Run** (Cmd + R).

8. **Validate the embedded bundle**
   ```bash
   grep -n "firestore is required" \
     ~/Library/Developer/Xcode/DerivedData/MinimumStandardsMobile-*/Build/Products/Debug-iphoneos/MinimumStandardsMobile.app/main.jsbundle
   ```
   You should see the guard strings from `@minimum-standards/firestore-model`. If you still find `getLatestHistoryForStandard(userId,` anywhere, the bundled JS is stale.

---

## 3. Quick Iteration Tips

- **During development:** Prefer disabling `FORCE_EMBEDDED_JS_BUNDLE` or setting `SKIP_BUNDLING=1` so Metro’s live bundle is used. This turns RN dev back into the normal Fast Refresh workflow and avoids multi-minute rebuild cycles for every JS tweak.
- **When testing embedded-bundle behavior:** Keep `FORCE_BUNDLING=1` + `--reset-cache` in the run script. That guarantees Xcode rebuilds the bundle with a clean cache every time you hit Cmd + R.
- **Workspace changes:** Any edit under `packages/*` requires `npm run build` in that package plus `npm install` inside `apps/mobile` before Metro sees it. Metro always reads the compiled JavaScript sitting under `apps/mobile/node_modules/.../dist`.
- **Inspecting the live bundle:** `npx react-native bundle --platform ios --dev true --minify false --bundle-output /tmp/dev-main.jsbundle --reset-cache` gives you an unminified snapshot you can `grep` for call‑sites.

---

## 4. Known Pitfalls & How We Fixed Them

1. **Stale helper code despite rebuilding**  
   Cause: Metro serves from `apps/mobile/node_modules`, not directly from `packages/…/dist`. Without `npm install` inside `apps/mobile`, you’ll keep re-bundling the old code.

2. **`Cannot read property 'call' of undefined` in Activity History**  
   - Original assumption: helper still being invoked positionally from a stale bundle.  
   - Actual cause: `getUserScopedCollections` called `bindings.doc(userDoc, ...)`, but `userDoc` is a `DocumentReference` (no `.doc` method in RNFirebase). `bindings.doc` tried to execute `parent.doc.call(...)`, so `parent.doc` was `undefined` and threw `undefined.call`.  
   - Fix: build intermediate `preferences = bindings.collection(userDoc, 'preferences')` and call `bindings.doc(preferences, 'dashboardPins')`. Rebuild the package + reinstall mobile deps to propagate the fix.

3. **Hidden Xcode bundling**  
   If you don’t explicitly control `SKIP_BUNDLING` or `FORCE_BUNDLING`, Xcode’s run script silently reuses its last `main.jsbundle`. This is the single biggest reason we end up doing “nuclear” rebuilds.

---

## 5. Recommended Configuration Cleanup

- **Development scheme:** Disable `FORCE_EMBEDDED_JS_BUNDLE` or set `SKIP_BUNDLING=1` so you can rely on Metro’s live reload. Reserve the embedded-bundle workflow for release or regression testing.
- **Automate the bundle check:** Add a CI step (or a simple script) that runs `grep -n "firestore is required"` on the produced `main.jsbundle` to confirm the guard strings are present before shipping.
- **Document the env vars in Xcode:** Keep `SKIP_BUNDLING` / `FORCE_BUNDLING` values checked into the scheme (shared) so teammates and automation use the same behavior.
- **Watch out for RN Firebase modular APIs:** When you need `doc` or `collection`, always call them on the `bindings` functions provided by `createActivityHistoryHelpers` rather than on `DocumentReference` instances themselves.

---

## 6. One-Command Resync Script (optional)

If you want a single script to perform the “nuclear” procedure, drop something like this into `scripts/reset-mobile-ios.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

pushd packages/firestore-model
npm run build
popd

pushd apps/mobile
npm install
lsof -ti :8081 | xargs kill || true
rm -rf ~/Library/Developer/Xcode/DerivedData/MinimumStandardsMobile-*
npx react-native start --reset-cache &
METRO_PID=$!
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios \
  --reset-cache
kill "$METRO_PID"
popd
```

Run the script, then handle the Xcode clean/build manually. This removes most of the copy‑paste toil and lowers the chance of missing a step.

---

Keeping this playbook handy should prevent future “mystery bundle” marathons and give everyone the same source of truth for how the build actually works. Update it whenever the configuration changes.***

