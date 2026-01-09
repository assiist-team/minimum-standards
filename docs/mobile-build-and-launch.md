# MinimumStandardsMobile – Build & Launch Playbook

_Last updated: 2026‑01‑08_

This document captures the full end‑to‑end workflow for rebuilding, bundling, and launching the React Native iOS app inside the `minimum_standards` monorepo. Follow these steps whenever you need a clean rebuild, are chasing bundle drift, or are preparing a release build.

---

## ⚠️ Non‑negotiable Workspace Rule

**If you touch anything under `packages/*`, you _must_ do two things before expecting Metro/Xcode to see the change:**

1. Inside that package: `npm run build` (writes the new code to its `dist/` folder).
2. Inside `apps/mobile`: `npm install` (refreshes `apps/mobile/node_modules/@minimum-standards/...` with the new dist files).

Metro and the Xcode bundler only read the compiled files living under `apps/mobile/node_modules`. Skipping either step leaves those files untouched, so you’ll keep bundling stale code no matter how many caches you blow away. Keep this rule in mind whenever you edit shared packages—the rest of the steps assume you’ve done it.

---

## Fast Refresh Daily Loop (TL;DR)

1. **Rebuild touched packages** via `npm run build` inside each package plus `npm install` inside `apps/mobile`.
2. **Preflight Metro** with `./scripts/check-metro.sh` (verifies Node >=20, Watchman watches, and that port `8081` is free).
3. **Launch the Fast Refresh scheme**: `cd apps/mobile && npm run dev:ios`. This starts Metro + the simulator together with `SKIP_BUNDLING=1` and `FORCE_EMBEDDED_JS_BUNDLE=0`.
4. **Check the logs** for `[AppDelegate] Using Metro bundle at:` and confirm the Dev Menu reads “Connected to Metro”.

See `scripts/mobile-dev-setup.md` for the full daily checklist and recovery steps.

---

## 1. Architecture Overview

- **Repo layout**
  - `packages/firestore-model`: shared Firestore helpers compiled to `dist/` and published via npm workspaces.
  - `apps/mobile`: React Native client that consumes the workspace packages via `node_modules/@minimum-standards/*`.
  - `apps/mobile/ios/MinimumStandardsMobile.xcworkspace`: Xcode project that builds the iOS app and always embeds a JS bundle.

- **Embedded bundle policy**
  - `AppDelegate` still inspects `FORCE_EMBEDDED_JS_BUNDLE` at launch. When the flag is `0` it prints `[AppDelegate] Using Metro bundle at: …` and streams code from Metro; when the flag is `1` it prints `[AppDelegate] FORCE_EMBEDDED_JS_BUNDLE enabled - loading embedded bundle` and falls back to the baked `main.jsbundle`.
  - The **“Bundle React Native code and images”** phase now honors `SKIP_BUNDLING`. If the environment provides `SKIP_BUNDLING=1`, the script logs that it is skipping bundling and leaves Metro in charge. Otherwise it exports `FORCE_BUNDLING=1`, appends `--reset-cache` to `EXTRA_PACKAGER_ARGS`, and rebuilds `main.jsbundle` on every run.
- **Scheme matrix**
  - `MinimumStandardsMobile (Fast Refresh)`  
    - Daily-driver scheme for Metro/Fast Refresh.  
    - Env vars: `FORCE_EMBEDDED_JS_BUNDLE=0`, `SKIP_BUNDLING=1`.  
    - Expect `[AppDelegate] Using Metro bundle at:` in the device log.  
    - CLI equivalent: ``SKIP_BUNDLING=1 FORCE_EMBEDDED_JS_BUNDLE=0 npx react-native run-ios --scheme "MinimumStandardsMobile (Fast Refresh)"`` (add `--simulator`/`--device` as needed).
  - `MinimumStandardsMobile (Embedded)`  
    - Regression / release / CI scheme that always bakes the JS bundle.  
    - Env vars: `FORCE_EMBEDDED_JS_BUNDLE=1`, `SKIP_BUNDLING=0`.  
    - Expect `[AppDelegate] FORCE_EMBEDDED_JS_BUNDLE enabled - loading embedded bundle`.  
    - CLI equivalent: ``FORCE_EMBEDDED_JS_BUNDLE=1 SKIP_BUNDLING=0 npx react-native run-ios --scheme "MinimumStandardsMobile (Embedded)"``.

Keep this in mind: if you launch the Embedded scheme without regenerating the bundle, you will still run whatever `main.jsbundle` is checked into the app resources.

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

6. **Regenerate the embedded bundle (required whenever you plan to run the Embedded scheme)**
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
   - Pick a scheme deliberately:
     - `MinimumStandardsMobile (Fast Refresh)` for Metro/Fast Refresh work (no bundling, `SKIP_BUNDLING=1`).
     - `MinimumStandardsMobile (Embedded)` for release/CI runs (forced bundling with `--reset-cache`).
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

- **During development:** Select the `MinimumStandardsMobile (Fast Refresh)` scheme (equivalent to `FORCE_EMBEDDED_JS_BUNDLE=0`, `SKIP_BUNDLING=1`) or just run `npm run dev:ios` inside `apps/mobile`. Both paths restore Fast Refresh, Dev Menu, and LogBox without multi-minute rebuilds.
- **Preflight Metro before every session:** `./scripts/check-metro.sh` validates Node/Watchman and ensures port `8081` is free so Xcode doesn’t silently fall back to the embedded bundle.
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

## 6. Nuclear Reset Script (`scripts/reset-mobile-ios.sh`)

Run `./scripts/reset-mobile-ios.sh` from the repo root whenever you need the “nuclear” rebuild (e.g., prepping the embedded bundle for regression tests or release validation). The script now lives in the repo and automates every step called out in Section&nbsp;2:

- Rebuilds every workspace package that exposes a `build` script (`npm run build` inside `packages/*`).
- Reinstalls `apps/mobile` dependencies so Metro/Xcode read the freshly compiled packages.
- Kills anything bound to port `8081`, clears `~/Library/Developer/Xcode/DerivedData/MinimumStandardsMobile-*`, and uninstalls the app from the booted simulator (when one is available).
- Re-runs `npx react-native bundle --reset-cache` so `apps/mobile/ios/main.jsbundle` matches the current workspace.
- Verifies the guard string `firestore is required` is present before exiting. Override the check via `BUNDLE_GUARD_STRING="my sentinel" ./scripts/reset-mobile-ios.sh` if we ever change the runtime message.
- Prints the follow-up command so you can immediately relaunch the embedded scheme without spelunking for env vars again.

### Launching the embedded bundle after the reset

After the script finishes, you can either select the `MinimumStandardsMobile (Embedded)` scheme inside Xcode or run the equivalent CLI:

```
FORCE_EMBEDDED_JS_BUNDLE=1 SKIP_BUNDLING=0 \
  npx react-native run-ios \
  --scheme "MinimumStandardsMobile (Embedded)" \
  --device "Ben's iPhone"
```

Drop the `--device` flag (or swap it for `--simulator "iPhone 15 Pro"`) when you want to target the currently booted simulator. Either way, you’ll see `[AppDelegate] FORCE_EMBEDDED_JS_BUNDLE enabled - loading embedded bundle` in the logs once the app boots.

---

Keeping this playbook handy should prevent future “mystery bundle” marathons and give everyone the same source of truth for how the build actually works. Update it whenever the configuration changes.***

