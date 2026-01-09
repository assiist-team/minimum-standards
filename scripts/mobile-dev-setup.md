# Mobile Dev Daily Loop

This checklist keeps local iOS development on the Fast Refresh path without regressing into embedded bundles.

## Prerequisites

- **Node 20+** (see `apps/mobile/package.json` engines)
- **Watchman** installed via Homebrew: `brew install watchman`
- **Xcode** with the `MinimumStandardsMobile.xcworkspace` already opened once (so the new shared schemes exist locally)

## Daily Workflow

1. **Sync shared packages when they change**
   ```bash
   # inside each touched package
   npm run build
   # then inside apps/mobile
   npm install
   ```
2. **Check Metro readiness**
   ```bash
   ./scripts/check-metro.sh
   ```
   - Verifies Node version, active Watchman watches, and that port `8081` is free.
   - Fix whatever it reports before launching Xcode; otherwise the app silently falls back to the embedded bundle.
3. **Launch Fast Refresh from the monorepo root**
   ```bash
   cd apps/mobile
   npm run dev:ios
   ```
   - Spawns Metro and `react-native run-ios` concurrently.
   - Forces `SKIP_BUNDLING=1` + `FORCE_EMBEDDED_JS_BUNDLE=0`, matching the `MinimumStandardsMobile (Fast Refresh)` scheme.
   - Pass `--simulator` or `--device` flags by appending them inside the quoted `react-native run-ios` command if needed.
4. **Verify the device log**
   - Expect `[AppDelegate] Using Metro bundle at:` when the app boots.
   - Use the Dev Menu (`Cmd + D`) or shake gesture to confirm it says “Connected to Metro”.
5. **Return to embedded bundle mode only when debugging regressions**
   - Quit Metro, switch the Xcode scheme to `MinimumStandardsMobile (Embedded)`, and rerun. This path re-enables the bundling run script and uses the baked `main.jsbundle`.

## If Metro wedges

1. Kill every leftover process: `lsof -ti :8081 | xargs kill`.
2. Clear Watchman & Metro caches: `watchman watch-del-all && watchman shutdown-server`.
3. Re-run `./scripts/check-metro.sh` followed by `npm run dev:ios`.

When all else fails, run `./scripts/reset-mobile-ios.sh` (documented in `docs/mobile-build-and-launch.md`) to regenerate the embedded bundle from scratch.
