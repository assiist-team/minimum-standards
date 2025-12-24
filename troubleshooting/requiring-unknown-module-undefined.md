# "Requiring unknown module \"undefined\"" when SyncStatusBanner mounts

## Summary
Release builds currently crash the moment `SyncStatusBanner` loads because Hermes tries to `require('@react-native-community/netinfo')` but the module isn't bundled. Debug builds swallow the error via LogBox, so the issue only surfaced after downgrading to React Native 0.76.5 and forcing embedded bundles.

## Symptoms
- Metro/Release logs show `Error: Requiring unknown module "undefined"` followed by a fatal exception in Hermes.
- Stack traces point at `getOptionalNetInfo` -> `SyncStatusBanner`.
- The crash only occurs when the banner renders (e.g., toggling airplane mode or when offline), while the rest of the app appears fine.

## Root Cause
- `SyncStatusBanner` calls `getOptionalNetInfo()` inside `apps/mobile/src/utils/optionalNetInfo.ts`, which performs a dynamic `require('@react-native-community/netinfo')` once per session.
- The dependency is **not listed** in `apps/mobile/package.json`, so Metro assigns module ID `undefined` at bundle time. Hermes then attempts to load module `undefined` and crashes.
- Because Debug builds were running against Metro, the exception was demoted to a yellow box. Release builds (embedded bundle) do not include LogBox and terminate on the missing module.

## Remediation
1. **Install the dependency**
   ```bash
   cd apps/mobile
   npm install @react-native-community/netinfo
   cd ios && pod install && cd ..
   ```
2. **Regenerate the bundle**
   - Stop any running Metro instance.
   - Run `npm run ios` (Debug) to let Metro rebuild its dependency graph.
   - For Release builds, run `npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output ios/main.jsbundle --assets-dest ios` after installing.
3. **Add runtime guards (already in place)**
   - `getOptionalNetInfo` already catches `require` failures and returns `null`; confirm no other code import NetInfo directly without guards.
4. **Optional: make the dependency truly optional**
   - If you prefer to keep SyncStatusBanner working even when NetInfo is absent, wrap the NetInfo-specific logic in a dynamic `import()` and avoid referencing the module at the top level. That ensures Metro does not emit the module unless it exists.

## Verification
- Run `npm run test` to ensure `SyncStatusBanner` tests (which mock NetInfo) still pass.
- Launch the app with Metro attached, toggle airplane mode, and confirm no "unknown module" warnings appear.
- Build a Release scheme (embedded bundle) and verify SyncStatusBanner renders without crashing.

## References
- `apps/mobile/src/components/SyncStatusBanner.tsx`
- `apps/mobile/src/utils/optionalNetInfo.ts`
- `apps/mobile/package.json`


