# React Native iOS Runtime Warnings (2025-12-14)

## Current status
- ✅ Dependencies realigned: RN 0.83.0 is now the version in `package.json`, `package-lock.json`, and `Podfile.lock`.
- ✅ `pointerEvents` warning removed via `patch-package` (see `patches/react-native-screens+4.18.0.patch`).
- ✅ Firebase modular migration kicked off (shared `firebaseApp.ts`, auth flows, stores, and tests already use modular helpers).
- ⚠️ App now crashes on launch: the binary ships Fabric/new-architecture code, but `AppDelegate.swift`, `.xcode.env`, and `Podfile` still initialize the legacy “Paper” bridge. React Native 0.83 aborts with `NSInternalInconsistencyException: You are trying to initialize the legacy architecture`.
- ⚠️ `UIScene` lifecycle warning still logs on device; Apple will start asserting soon, so we need to add a scene manifest + delegate after the Fabric migration stabilizes.
- ⏳ Rebuild the embedded JS bundle once the Fabric path succeeds so device installs match the Metro runtime.

## Crash analysis – legacy bridge vs. Fabric
| Component | Current state | Required state |
| --- | --- | --- |
| `.xcode.env` | Forces `RCT_NEW_ARCH_ENABLED=0`, `USE_FABRIC=0`, `RCT_FABRIC_ENABLED=0`. | Export `1` for those vars so Xcode builds Fabric slices. |
| `Podfile` | `use_react_native!(..., :fabric_enabled => false, :new_arch_enabled => false)` | Both flags must be `true`, then rerun `pod install`. |
| `AppDelegate.swift` | Manually creates an `RCTBridge`, sets up a UIWindow, and calls the legacy `RCTLinkingManager`. | Subclass `RCTAppDelegate`, let it bootstrap Fabric/Turbo modules, and override only Firebase + bundle selection hooks. |
| `Info.plist` | Already has `<key>RCTNewArchEnabled</key><true/>`. | ✔️ matches the desired runtime once the other bits are aligned. |
| `index.js` | Uses legacy `registerCallableModule` and deep-imported `BatchedBridge` | Must rely on Fabric's native auto-registration. Removed manual shim and `__r` wrapper. |

Because the compiled runtime now assumes Fabric, the moment `RCTBridge` tries to boot the Paper pipeline the guard rails throw the quoted exception before JavaScript loads.

## Remediation checklist
1. **Enable Fabric + new architecture in the build environment.**
   - `.xcode.env` now exports `RCT_NEW_ARCH_ENABLED=1`, `USE_FABRIC=1`, `RCT_FABRIC_ENABLED=1` so Xcode picks up the right flags.
   - When running CocoaPods manually, prefix with the same vars to keep everything in sync:
     ```bash
     cd apps/mobile/ios
     RCT_NEW_ARCH_ENABLED=1 USE_FABRIC=1 RCT_FABRIC_ENABLED=1 bundle exec pod install
     ```
2. **Update CocoaPods configuration.**
   - `Podfile` now calls `use_react_native!(..., :fabric_enabled => true, :new_arch_enabled => true)` so the pods build the Fabric-enabled React Native static libs.
3. **Adopt `RCTAppDelegate` for the iOS entry point.**
   - `AppDelegate.swift` inherits from `RCTAppDelegate`, configures Firebase before calling `super.application`, retains the `FORCE_EMBEDDED_JS_BUNDLE` override, and still forwards URLs to Google Sign-In before falling back to React Native's linking stack. With this change React Native owns the bridge lifecycle and we no longer instantiate the deprecated Paper bridge ourselves.
4. **Fix JS Entry Point for Fabric.**
   - Removed manual `BatchedBridge` hacks and `__r` wrapper in `index.js` as they break Fabric module registration.
   - Rebuilt embedded bundle: `npx react-native bundle --entry-file index.js --platform ios --dev true --minify false --bundle-output ios/main.jsbundle --assets-dest ios`
5. **Clean and rebuild.**
   - `rm -rf ios/Pods ios/Podfile.lock ios/build ~/Library/Developer/Xcode/DerivedData/*MinimumStandardsMobile*`
   - `npm install && cd ios && RCT_NEW_ARCH_ENABLED=1 USE_FABRIC=1 RCT_FABRIC_ENABLED=1 bundle exec pod install`
   - Open the workspace in Xcode, select a clean DerivedData path, then build/run on-device (or `FORCE_EMBEDDED_JS_BUNDLE=1 xcrun xcodebuild ...` if you prefer CLI).

Once the binary boots without the exception, rebuild the embedded bundle (`npx react-native bundle ...`) and reinstall on device to verify Crashlytics stays quiet.

## Additional warnings to monitor
- **UIScene lifecycle** – Apple now prints `UIScene lifecycle will soon be required`. After the Fabric migration sticks, add a `SceneDelegate` + `UIApplicationSceneManifest` so we are ready for the enforcement window (target: iOS 18 adoption before beta 3).
- **FirebaseMessaging swizzling** – The `I-FCM001000` message is informational. If we ever decide to disable swizzling, add `FirebaseAppDelegateProxyEnabled=false` to `Info.plist` and wire the delegate methods manually; no action needed right now.
- **Empty dSYM** – Debug-on-device builds emit `empty dSYM file detected` when `DEBUG_INFORMATION_FORMAT` is `dwarf` instead of `dwarf-with-dsym`. Safe to ignore for local runs; switch formats in the Xcode build settings if we ever need full device symbolication before archiving.
- **RCTEventEmitter errors** – If `[Error: Failed to call into JavaScript module method RCTEventEmitter.receiveEvent()]` persists, it means the device still has a stale JS bundle (with the old hacks). **Action: Clean Build Folder + Delete App from device** to force a fresh install.

## Next steps
1. ✅ ~~Realign dependencies with RN 0.83.0~~
2. ✅ ~~Remove `pointerEvents` warning via patch-package~~
3. ✅ ~~Begin Firebase modular migration~~ (auth flows complete)
4. ⏳ **Finish Firebase modular migration**
   - Convert the remaining Firestore helpers (`useStandardHistory`, `useActivities`, analytics helpers, converters) to the modular API.
   - Add `globalThis.RNFB_MODULAR_DEPRECATION_STRICT_MODE = true;` early in app bootstrap to guard against regressions.
5. ⏳ **Rename duplicate Settings routes** (give the stack container a unique name like `SettingsRoot` to silence the nested-name warning).
6. ⏳ **Adopt UIScene lifecycle** once the Fabric build is stable.
7. ⏳ **Rebuild + embed the JS bundle** after the above changes, reinstall with `FORCE_EMBEDDED_JS_BUNDLE=1`, and confirm a warning-free launch on hardware.

> Notes  
> - Do **not** hide these warnings via `LogBox.ignoreLogs`; they continue to be valuable smoke tests.  
> - Keep the `global.__r` safeguard until multiple clean Fabric boots confirm no missing module IDs.
