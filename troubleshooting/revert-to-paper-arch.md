# Revert to Old Architecture (Paper) - Tracking Log

**Objective:** Revert iOS native architecture from Fabric (New Architecture) to Paper (Old Architecture) while maintaining React Native 0.83.0.
**Reason:** The Fabric initialization of `RCTEventEmitter` is failing on-device, causing a crash/blank screen. The "known good" state was running on the Old Architecture.

## Plan

1.  [x] Revert Configuration Files
    *   `.xcode.env` -> `RCT_NEW_ARCH_ENABLED=0`
    *   `Podfile` -> `fabric_enabled => false`, `new_arch_enabled => false`
    *   `Info.plist` -> `RCTNewArchEnabled` -> `false`
    *   `android/gradle.properties` -> Ensure `newArchEnabled=false` (Syncing Android for consistency)
2.  [x] Revert `AppDelegate.swift`
    *   Replace `RCTAppDelegate` inheritance with `UIResponder, UIApplicationDelegate, RCTBridgeDelegate`.
    *   Restore manual `RCTBridge` and `RCTRootView` initialization.
    *   Preserve `FirebaseApp.configure()` and `GoogleSignIn` handling.
    *   Preserve `FORCE_EMBEDDED_JS_BUNDLE` logic (adapted for legacy delegate).
3.  [x] Revert `index.js`
    *   Simplifed back to standard import pattern, removing the manual `require` / watchdog logic used for debugging.
4.  [ ] Clean Build Artifacts
    *   (User will perform this manually)
5.  [ ] Re-install Dependencies
    *   (User will perform this manually)
6.  [ ] Verification
    *   (User will perform this manually)

## Execution Log

### 1. Configuration Changes
*   Verified `.xcode.env`: `RCT_NEW_ARCH_ENABLED=0`
*   Verified `Podfile`: `fabric_enabled => false`
*   Verified `Info.plist`: `RCTNewArchEnabled` is `false`
*   Verified `android/gradle.properties`: `newArchEnabled=false`

### 2. AppDelegate Revert
*   Rewrote `AppDelegate.swift` to use old `RCTBridgeDelegate` pattern.
*   Included `FirebaseApp.configure()`, `GoogleSignIn` handler, and `RCTLinkingManager`.

### 3. Index.js Cleanup
*   Simplified `index.js` to standard AppRegistry usage.

### 4. Build/Install
*   *Note:* `rm -rf` command failed on DerivedData due to sandbox permissions. User will run build cleanup manually.


