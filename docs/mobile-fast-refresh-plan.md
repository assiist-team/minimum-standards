# React Native Fast Refresh Enablement Plan

_Goal: get back to Fast Refresh without reintroducing the silent-breakage marathon that forced us onto embedded bundles._

---

## 1. Historical Context & Current State

### 1.1 Why we forced embedding

- Attempting to run off Metro in Debug repeatedly failed (Hermes crashes, silent red screens, phantom “refused connection” errors).  
- `troubleshooting/metro-debug-builds-stuck-on-embedded-bundle.md` documents that the quickest unblock was hard-forcing the embedded bundle path while we shipped fixes elsewhere.  
- `docs/mobile-build-and-launch.md` now treats this embed-first flow as “non-negotiable” to avoid shipping stale code: regenerate `main.jsbundle`, kill caches, rebuild.

### 1.2 What the code does today

- `AppDelegate.swift` inspects `FORCE_EMBEDDED_JS_BUNDLE`. With it set to `1`, every Debug boot prints `[AppDelegate] FORCE_EMBEDDED_JS_BUNDLE enabled - loading embedded bundle` and never talks to Metro.  
  ```49:58:apps/mobile/ios/MinimumStandardsMobile/AppDelegate.swift
#if DEBUG
  if shouldForceEmbeddedBundle {
    NSLog("[AppDelegate] FORCE_EMBEDDED_JS_BUNDLE enabled - loading embedded bundle")
    return embeddedBundleURL()
  }
  let metroURL = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
  NSLog("[AppDelegate] Using Metro bundle at: \(metroURL?.absoluteString ?? "nil")")
  return metroURL
```
- The shared scheme (`xcshareddata/xcschemes/MinimumStandardsMobile.xcscheme`) still exports `FORCE_EMBEDDED_JS_BUNDLE`, so teammates inherit the override automatically.
- The Xcode Run Script phase hardcodes `FORCE_BUNDLING=1` and appends `--reset-cache`, forcing a fresh bundle on every build rather than starting Metro.  
  ```183:198:apps/mobile/ios/MinimumStandardsMobile.xcodeproj/project.pbxproj
export FORCE_BUNDLING=1
export EXTRA_PACKAGER_ARGS="${EXTRA_PACKAGER_ARGS} --reset-cache"
```
- `main.jsbundle` lives in the Resources build phase, so the binary _always_ has a baked-in JS payload—even in Debug.
- Shared packages must be rebuilt → `npm install` inside `apps/mobile`, or the bundle (embedded or Metro) keeps serving stale code.

### 1.3 Pain today

- Iteration is glacial: Cmd + R triggers Metro cache nukes + `npx react-native bundle`, so every tweak costs minutes.
- Debugging is blind: no Dev Menu, no LogBox, no Fast Refresh, no on-device inspector.
- Switching back to Metro is non-trivial; toggling just one flag leaves the run script, resources, and scheme out of sync and risks silent bundle drift again.

---

## 2. Goals & Guardrails

1. **Daily development** uses Metro (Fast Refresh, Dev Menu, LogBox) with predictable commands.  
2. **Embedded bundle fallback** stays one click away for CI, regression hunts, or when Metro flakes.  
3. **Zero regressions** to the prior “stale bundle” bug: the embedded path remains documented, reproducible, and verifiable (grep guard, logs).  
4. **No architecture churn**: stay on the Paper bridge + current Pod setup. Keep AppDelegate logic but make it respect scheme settings.  
5. **Minimal new tooling**: rely on RN CLI + existing scripts; introduce shell helpers only where they collapse manual multi-step flows.  
6. **Workspace contract stays enforced**: any package edit still requires `npm run build` + `npm install` in `apps/mobile`.

---

## 3. Risks We Must Mitigate

- **Silent Metro failures** (bad `NODE_BINARY`, wedged Watchman) previously forced us into embed mode. We need health checks so devs know when Metro isn’t actually serving.  
- **Run-script drift**: even if Metro is enabled, the `Bundle React Native code and images` phase can overwrite the live bundle unless `SKIP_BUNDLING` is honored.  
- **Resource confusion**: `main.jsbundle` is checked into the app bundle. If a dev forgets to rebuild it before a release run, they ship the wrong code.  
- **Shared packages**: forgetting to rebuild + reinstall makes it look like Metro is broken when it’s just serving old dist files.

---

## 4. Implementation Plan

### Phase A – Dual Scheme Strategy (Fast Refresh vs. Embedded)

1. **Clone the shared scheme**  
   - `MinimumStandardsMobile (Fast Refresh)`  
     - `FORCE_EMBEDDED_JS_BUNDLE=0` (or removed)  
     - `SKIP_BUNDLING=1`  
     - `REACT_NATIVE_PACKAGER_HOSTNAME` optional override for device testing.  
   - `MinimumStandardsMobile (Embedded)`  
     - `FORCE_EMBEDDED_JS_BUNDLE=1`  
     - `SKIP_BUNDLING=0` (allow bundling)  
     - Keep as default for CI/release, but not for local dev.

2. **Teach the run script to respect `SKIP_BUNDLING`**  
   - Wrap the existing `FORCE_BUNDLING=1` export with a conditional so the script no-ops when `SKIP_BUNDLING=1`.  
   - When `SKIP_BUNDLING=0`, keep the current behavior (force bundle + `--reset-cache`).

3. **Document the schemes** inside `docs/mobile-build-and-launch.md`: when to use each, expected console logs, and CLI equivalents (`SKIP_BUNDLING=1 FORCE_EMBEDDED_JS_BUNDLE=0 npx react-native run-ios`).

### Phase B – Developer Ergonomics + Health Checks

1. **Add `npm run dev:ios`** in `apps/mobile/package.json` to launch Metro + simulator with the Fast Refresh env vars baked in.  
2. **Introduce `scripts/check-metro.sh` (optional)**  
   - Confirms Node path, ensures Watchman is watching the repo, and that port 8081 is free before launching. Warns early instead of letting Xcode silently fall back to embed.  
3. **Add a short guide** (`scripts/mobile-dev-setup.md` or expand the existing doc) outlining the daily loop:  
   - Touch package? → `npm run build` + `npm install`.  
   - Start Metro via `npm run dev:ios` (or `npm start`).  
   - Verify Dev Menu shows “Connected to Metro”.

_Status: ✅ Complete (2026‑01‑08)._  
- `apps/mobile/package.json` now exposes `npm run dev:ios`, which spawns Metro + `react-native run-ios` with `SKIP_BUNDLING=1` and `FORCE_EMBEDDED_JS_BUNDLE=0` by default.  
- `scripts/check-metro.sh` validates Node ≥20, Watchman watches, and port 8081 availability before attempting an Xcode run.  
- `scripts/mobile-dev-setup.md` and `docs/mobile-build-and-launch.md` document the TL;DR daily workflow, Metro preflight, and verification logs.

### Phase C – Embedded Bundle Fallback Hardening

1. **Formalize the “nuclear” script** already described in Section 2 of the build doc (`scripts/reset-mobile-ios.sh`).  
   - Steps: package rebuilds, `npm install`, kill Metro, `npx react-native bundle --reset-cache`, optional `simctl uninstall`.  
2. **Add a verification step** to the script that greps for known guard strings (e.g., `"firestore is required"`) in the produced `main.jsbundle`.  
3. **Document how to swap schemes/flags** for regression testing, including CLI invocation (`FORCE_EMBEDDED_JS_BUNDLE=1 npx react-native run-ios --device ...`).

_Status: ✅ Complete (2026‑01‑08)._  
- `scripts/reset-mobile-ios.sh` now automates the rebuild/install/kill/bundle sequence, clears DerivedData, optionally runs `simctl uninstall`, and gates success on finding `firestore is required` (override via `BUNDLE_GUARD_STRING=...`).  
- `docs/mobile-build-and-launch.md` documents the script, lists each automated step, and shows the exact CLI (`FORCE_EMBEDDED_JS_BUNDLE=1 SKIP_BUNDLING=0 npx react-native run-ios ...`) for regression testing without touching Xcode.

### Phase D – Validation & Rollout

1. **Fast Refresh path smoke test**  
   - Launch simulator with the new scheme. Expect `[AppDelegate] Using Metro bundle at ...`.  
   - Edit a screen, confirm Fast Refresh and LogBox.  
   - Edit `packages/shared-model`, run `npm run build` + `npm install`, confirm Metro picks up the change.
2. **Embedded path regression test**  
   - Run the reset script, switch schemes, build. Expect the `[AppDelegate] FORCE_EMBEDDED...` log and guard string in the bundle.  
   - Kill Metro mid-run to ensure the app keeps working (since it’s using the embedded bundle).
3. **Team rollout**  
   - Update docs + Slack announcement so everyone knows which scheme to run locally.  
   - Optional: pre-commit check to warn if someone re-enables `FORCE_EMBEDDED_JS_BUNDLE` in the Fast Refresh scheme.

---

## 5. Implementation Tracking

| Phase | Scope | Status | Notes |
| --- | --- | --- | --- |
| Phase A – Dual Scheme Strategy | Twin schemes + `SKIP_BUNDLING`-aware run script + doc updates | ✅ **Complete (2026‑01‑08)** | `MinimumStandardsMobile (Fast Refresh)` and `MinimumStandardsMobile (Embedded)` committed; run script now skips when `SKIP_BUNDLING=1`; build doc updated with scheme matrix/CLI instructions. |
| Phase B – Developer Ergonomics + Health Checks | `npm run dev:ios`, Metro health check, daily loop doc | ✅ **Complete (2026‑01‑08)** | `npm run dev:ios` added, `scripts/check-metro.sh` enforces Metro prerequisites, and the Fast Refresh daily loop now lives in `scripts/mobile-dev-setup.md` + the build playbook TL;DR. |
| Phase C – Embedded Bundle Hardening | Reset script + guard-string verification + regression instructions | ✅ **Complete (2026‑01‑08)** | `scripts/reset-mobile-ios.sh` automates the nuclear rebuild, verifies `"firestore is required"`, and the build doc now covers the regression CLI/flag handoff. |
| Phase D – Validation & Rollout | Fast Refresh + embedded smoke tests, rollout comms | ⏳ **Not started** | Blocked on Phase B/C deliverables; plan smoke tests once automation exists. |

Use this table as the single source of truth before touching any Metro- or bundle-adjacent config. Update the status/date columns as each phase lands.

---

## 6. Follow-ups / Decision Points

- **Automation depth**: Do we want a watcher that automatically rebuilds packages + reinstalls into `apps/mobile`, or is manual still acceptable?  
- **CI enforcement**: Should CI fail if `main.jsbundle` changes without running the reset script (guarding against stale bundles)?  
- **Telemetry**: Do we add a lightweight runtime check (e.g., console.warn if running embedded bundle in Debug without the flag) to catch accidental regressions?  
- **Longer-term**: Once Metro is reliable again, revisit whether we can remove the embedded bundle from Debug entirely and keep it only for Release artifacts.

Answering these will determine how strict we make the guardrails after the initial rollout.
