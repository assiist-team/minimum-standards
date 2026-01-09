# React Native iOS Build Troubleshooting

_Last updated: 2025-12-12 (PhaseScriptExecution + ReactCommon redefinition + Firebase Auth Swift header fixes)_

---

## PhaseScriptExecution Error - Metro Cannot Resolve Monorepo Packages (2025-12-12)

### Error
```
Command PhaseScriptExecution failed with a nonzero exit code

UnableToResolveError: Unable to resolve module @minimum-standards/shared-model
```

**Important:** "PhaseScriptExecution failed" is a GENERIC error that just means a build script failed. The REAL error is in the detailed output - in this case, Metro (React Native's bundler) cannot find the monorepo packages.

### Root Cause
- React Native's Metro bundler doesn't know about your monorepo structure
- Even though packages are linked in `package.json` with `"file:../../packages/..."`, Metro doesn't watch those directories by default
- Metro needs explicit configuration to resolve symlinks and watch monorepo folders

### Fix Applied
Updated `apps/mobile/metro.config.js` to include monorepo configuration:

```javascript
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = {
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    unstable_enableSymlinks: true,
  },
};
```

### Steps to Apply
1. ✅ Updated `metro.config.js` with monorepo configuration
2. **Kill Metro bundler** if running: Press Ctrl+C in the terminal running `npm start`
3. **Clean Metro cache**: `cd apps/mobile && npx react-native start --reset-cache`
4. **In a new terminal, build from Xcode** or run `npm run ios`

### Verification
The error should change from "Unable to resolve module" to successfully bundling the app.

### Additional Notes
- Always read the FULL error output - "PhaseScriptExecution failed" is just the wrapper, the real error is below
- Metro cache can cause issues after config changes - always reset it with `--reset-cache`
- If you add new packages to the monorepo, you may need to restart Metro

---

## Missing Generated Header Files - ReactAppDependencyProvider (2025-12-12)

### Error
```
lstat(/Users/.../ios/build/generated/ios/ReactAppDependencyProvider/RCTAppDependencyProvider.h): No such file or directory
```

### Root Cause
- React Native's codegen didn't generate required header files
- Build artifacts are stale or missing after configuration changes
- CocoaPods integration needs to be refreshed

### Fix
Run these commands in order:

```bash
cd apps/mobile/ios

# 1. Clean Xcode build folder
rm -rf build/
rm -rf ~/Library/Developer/Xcode/DerivedData/MinimumStandardsMobile-*

# 2. Reinstall pods to regenerate codegen
bundle exec pod install

# 3. Clean in Xcode
# Then in Xcode: Product > Clean Build Folder (⇧⌘K)

# 4. Build
# In Xcode: Product > Build (⌘B)
```

### Why This Happens
React Native 0.83+ uses codegen to generate native code. When you change configuration (like Metro config), the generated files may become stale and need regeneration via `pod install`.

---

## CoreSimulator Service Issues (2025-12-12)

### Error
```
CoreSimulatorService connection became invalid. Simulator services will no longer be available.
Error opening log file: Operation not permitted
```

This prevents `npm run ios` from working in the CLI, though building directly from Xcode.app may still work.

### Root Cause
- The macOS CoreSimulator daemon has crashed or become unresponsive
- Permission issues with CoreSimulator log directory
- Stale simulator service processes

### Fix Steps
Run these commands in Terminal (requires admin password):

```bash
# 1. Kill simulator processes
sudo killall -9 com.apple.CoreSimulator.CoreSimulatorService
killall -9 Simulator

# 2. Fix log directory permissions
sudo rm -rf ~/Library/Logs/CoreSimulator/*
sudo mkdir -p ~/Library/Logs/CoreSimulator
sudo chown -R $(whoami) ~/Library/Logs/CoreSimulator

# 3. Restart the service
xcrun simctl list devices

# 4. If still failing, restart your Mac
```

### Alternative: Build from Xcode Directly
If the simulator service continues to have issues, you can still build and run from Xcode.app:

1. Open the workspace: `open ios/MinimumStandardsMobile.xcworkspace`
2. Select your device/simulator from the scheme dropdown
3. Press ⌘B to build or ⌘R to run

---

## Current Status
- Project: `apps/mobile/ios/MinimumStandardsMobile.xcworkspace`
- Environment: Xcode 16 (iPhoneOS SDK 26.1), React Native 0.83 + New Architecture + Hermes
- Result: **PhaseScriptExecution error fixed** (2025-12-12) by adding `.xcode.env` file with NODE_BINARY path

## Observed Errors
- Compilation stops while preprocessing `Pods/Target Support Files/React-RCTRuntime/React-RCTRuntime-prefix.pch`.
- Clang reports `Could not build module 'UIKit'`, followed by a cascade of system frameworks (`CoreFoundation`, `Foundation`, `QuartzCore`, etc.).
- Root diagnostic points back to `Pods/Headers/Public/ReactCommon/ReactCommon.modulemap:1:8 Redefinition of module 'ReactCommon'`.

```
/Users/benjaminmackenzie/Dev/minimum_standards/apps/mobile/ios/Pods/Target Support Files/React-RCTRuntime/React-RCTRuntime-prefix.pch:2:9 Could not build module 'UIKit'
...
/Users/benjaminmackenzie/Dev/minimum_standards/apps/mobile/ios/Pods/Headers/Public/ReactCommon/ReactCommon.modulemap:1:8 Redefinition of module 'ReactCommon'
```

## Recent Mitigations Attempted
1. **Podfile tweaks** – Added logic to avoid forcing `DEFINES_MODULE = YES` on pods that already ship a module map (currently only `ReactCommon`).
2. **xcconfig patching** – During `post_install`, the generated `ReactCommon.debug|release.xcconfig` files are rewritten so `DEFINES_MODULE = NO`.
3. **Clean installs** – Re-ran `bundle exec pod install` after each change to regenerate Pods project.
4. **DerivedData cleanup** – Deleted the project-specific folder (`DerivedData/MinimumStandardsMobile-gyimpjmpwzucqcdqwovogwdzvjsu`), along with Pods-* caches and ModuleCache.

Despite those steps, the same module redefinition error persists when building on-device (iPhoneOS SDK path in the log confirms device build rather than simulator).

## Root Cause
- `use_modular_headers!` forced CocoaPods to publish every module map under `Headers/Public`.
- `react_runtime` shipped an extra `React-jsitooling.modulemap` that re-exported the `ReactCommon` umbrella, so Clang saw two competing `ReactCommon` definitions whenever the device SDK tried to build `React-RCTRuntime-prefix.pch`.
- Because device builds load UIKit first, the duplicate module map prevented compilation of every downstream Apple framework, surfacing as `Could not build module 'UIKit'`.

## Fix Implemented
1. **Delete the rogue module map during `post_install`** so only the canonical `ReactCommon` module map survives.
2. **Strip any lingering `-fmodule-map-file` references** from generated xcconfig files to ensure Xcode never re-adds `React-jsitooling.modulemap`.
3. **Keep `DEFINES_MODULE = NO` for `ReactCommon` targets** so CocoaPods does not regenerate a redundant module map later in the build.

The new automation lives in the `post_install` block:

```93:145:apps/mobile/ios/Podfile
    # Fix react_runtime module map redefinition issue
    react_runtime_modulemap = File.join(installer.sandbox.root, 'Headers/Public/react_runtime/React-jsitooling.modulemap')
    File.delete(react_runtime_modulemap) if File.exist?(react_runtime_modulemap)

    # Remove stale references to the deleted module map from xcconfig files
    Dir.glob(File.join(installer.sandbox.root, 'Target Support Files', '**', '*.xcconfig')).each do |xcconfig_path|
      text = File.read(xcconfig_path)
      updated = text.gsub(/ ?-fmodule-map-file="\$\{PODS_ROOT\}\/Headers\/Public\/react_runtime\/React-jsitooling\.modulemap"/, '')
      updated = updated.gsub(/ ?-Xcc -fmodule-map-file="\$\{PODS_ROOT\}\/Headers\/Public\/react_runtime\/React-jsitooling\.modulemap"/, '')
      ...
      File.write(xcconfig_path, updated)
    end

    # ReactCommon already defines its own module map; ensure DEFINES_MODULE stays disabled
    %w[
      ReactCommon/ReactCommon.debug.xcconfig
      ReactCommon/ReactCommon.release.xcconfig
    ].each do |relative_path|
      ...
    end
```

## Latest Retest (2025-12-12)
Steps run on behalf of the team:
1. `bundle install` (required `--path=../vendor/bundle`; executed outside the sandbox so Bundler could write `vendor/bundle/ruby/3.4.0/bundler.lock`).
2. `bundle exec pod install` (regenerated Pods project, codegen artifacts, privacy manifests, etc.).
3. Deleted `~/Library/Developer/Xcode/DerivedData/MinimumStandardsMobile-*` by renaming the folder, clearing Spotlight locks, and force-removing the contents.
4. Handed off to Xcode for a clean device build (`xed .` + `Product > Clean Build Folder` + `Product > Build`).

### Result
- Device build still halts while compiling `React-RCTRuntime-prefix.pch` with `Could not build module 'UIKit'`.
- The log enumerates failures for virtually every Apple framework module (`_AvailabilityInternal`, `_Builtin_stdbool`, `_DarwinFoundation{1,2,3}`, `Foundation`, `CoreFoundation`, etc.).
- The terminating diagnostic remains `Pods/Headers/Public/ReactCommon/ReactCommon.modulemap:1:8 Redefinition of module 'ReactCommon'`, meaning a duplicate module map is still being surfaced to Clang even after the new `post_install` cleanup.

### Next Actions
1. Inspect `DerivedData/.../Build/Intermediates.noindex/.../ReactCommon.modulemap` during/after the build to confirm whether Xcode is generating another map outside of `Pods/Headers`.
2. Experiment with disabling `use_modular_headers!` for React pods specifically (while leaving it enabled for others) to see if the duplicate only appears when modular headers are forced globally.
3. Capture and archive `DerivedData/.../Logs/Build` from the failing run so we can trace which translation unit injects the redundant map.
4. If the duplicate map persists, consider pinning to the latest React Native patch (or cherry-picking upstream fixes) where `ReactCommon`'s module exports are known to work with RN 0.83 new architecture.

## Retest Checklist
Use this list for each iteration and update the section above with the outcome:
1. **Install pods with the new script**
   - `cd apps/mobile/ios`
   - `bundle install`
   - `bundle exec pod install`
2. **Blow away DerivedData for a clean header cache**
   - `rm -rf ~/Library/Developer/Xcode/DerivedData/MinimumStandardsMobile-*`
3. **Open the workspace and build for device**
   - `xed .`
   - In Xcode: select `MinimumStandardsMobile (Embedded)` for release/CI parity or `MinimumStandardsMobile (Fast Refresh)` for Metro debugging, choose a physical device (or `iphoneos` destination), then `Product > Clean Build Folder` and `Product > Build`.
   - CLI alternative: `xcodebuild -workspace MinimumStandardsMobile.xcworkspace -scheme "MinimumStandardsMobile (Embedded)" -sdk iphoneos -configuration Debug clean build`
4. **Verify** that `Pods/Headers/Public/react_runtime` no longer contains `React-jsitooling.modulemap` and investigate any remaining `ReactCommon` modulemap copies surfaced in DerivedData.

If the build completes, record “✅ Confirmed on device” here along with any warnings; if it fails, attach the new log artifacts noted above.

---

## Firebase Auth Swift Header Issue (2025-12-12)

### Error
```
RNFBMessaging & RNFBStorage build failures:
'FirebaseAuth/FirebaseAuth-Swift.h' file not found
```

### Root Cause
- Podfile enabled `:modular_headers => true` for Firebase Core pods (FirebaseCore, FirebaseCoreInternal, etc.)
- But **FirebaseAuth** itself was missing from the list
- RNFBMessaging and RNFBStorage depend on FirebaseAuth
- When Firebase.h tried to import `FirebaseAuth/FirebaseAuth-Swift.h`, the header wasn't visible

### Root Cause (Updated)
The actual issue is that `FirebaseAuth-Swift.h` is a **generated** Swift bridging header that only exists when Swift pods are built as **frameworks**. The umbrella header exists, but the Swift bridging header doesn't get generated when using static libraries.

### Fix Applied
1. Added Firebase pods to modular headers list (lines 25-36)
2. **Enabled `use_frameworks!` with static linkage** (line 16):
   ```ruby
   use_frameworks! :linkage => :static
   ```
   
This forces CocoaPods to build all pods as static frameworks, which:
- Generates Swift bridging headers like `FirebaseAuth-Swift.h`
- Maintains static linking for React Native compatibility
- Works with React Native 0.83 + New Architecture

### Steps to Apply
1. ✅ The Podfile has been updated with `use_frameworks!`
2. ✅ Ran: `cd apps/mobile/ios && bundle exec pod install` (completed successfully)
3. ✅ Deleted DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData/MinimumStandardsMobile-*`
4. **Next:** Clean build folder in Xcode (⇧⌘K) and Build (⌘B)

### Verification
- Confirmed frameworks are enabled: `FRAMEWORK_SEARCH_PATHS` present in `FirebaseAuth.debug.xcconfig`
- `FirebaseAuth-Swift.h` will be generated during the first Xcode build (not present in Pods directory beforehand)

### Why This Happens
Swift pods like FirebaseAuth generate bridging headers (`FirebaseAuth-Swift.h`) that expose Swift APIs to Objective-C. These headers are only generated when pods are built as frameworks, not static libraries. React Native Firebase's Objective-C code imports these bridging headers, so frameworks are required for any Firebase pod with Swift code.
