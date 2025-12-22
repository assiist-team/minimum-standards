# Fabric Migration & Crash Tracking (Dec 15, 2025)

**Status:** 🔴 CRITICAL BLOCKER
**Issue:** `RCTEventEmitter` fails to register in React Native 0.83.0 (Fabric).
**Symptom:** App launches, auths, then crashes with `Failed to call into JavaScript module method RCTEventEmitter.receiveEvent()`.

## Findings

1.  **Architecture Lock:** React Native 0.83.0 *forces* the New Architecture (Fabric).
    *   Attempting to set `RCT_NEW_ARCH_ENABLED=0` triggers a `pod install` warning: *"Calling pod install with RCT_NEW_ARCH_ENABLED=0 is not supported anymore... The application will run with the New Architecture enabled by default."*
    *   This makes reverting to the "Old Architecture" (Paper) impossible without downgrading React Native itself (likely to 0.76 or lower).

2.  **Native State:**
    *   `AppDelegate` is correctly using `RCTAppDelegate` (Fabric).
    *   Pods are correctly installed for Fabric.
    *   App boots successfully (`didFinishLaunching completed`), renders the loading screen, and completes Firebase auth.

3.  **The Crash:**
    *   Occurs immediately after the first re-render / event emission.
    *   Error: `Module has not been registered as callable. Registered callable JavaScript modules (n = 7): ... Did you forget to call registerCallableModule?`
    *   Missing module: `RCTEventEmitter` (which handles all touch/scroll events).
    *   The 7 registered modules (`AppRegistry`, `HMRClient`, etc.) show that *some* auto-registration works, but the critical UI event bridge is broken.

4.  **Root Cause Hypothesis:**
    *   **Incompatibility:** React Native 0.83.0 Fabric implementation has a regression or requires a specific configuration for `RCTEventEmitter` that is missing in our hybrid/migrated codebase.
    *   **JS Bundle Mismatch:** Even with `FORCE_EMBEDDED_JS_BUNDLE`, if the JS side of React Native doesn't handshake correctly with the Fabric C++ TurboModules, this registration fails.

## Failed Attempts
*   [x] Reverting to Old Architecture (blocked by RN 0.83 tooling).
*   [x] Manual `BatchedBridge` registration in `index.js` (caused "undefined" errors, didn't fix Fabric).
*   [x] Clean Build / Reinstall (ruled out cache issues).

## Recommended Next Steps (For User Consideration)
1.  **Downgrade React Native:** Drop to **0.76.x** (last stable release supporting Old Architecture). This is the only guaranteed way to get back to the "known good" Paper bridge.
2.  **Disable Fabric (Advanced):** Requires deep patching of `react-native` scripts to bypass the 0.83 enforcements (highly risky).
3.  **Wait for Fix:** 0.83 is very new; this may be a framework bug.


