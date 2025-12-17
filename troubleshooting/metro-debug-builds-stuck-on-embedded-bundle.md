# Metro fails to attach for Debug builds (FORCE_EMBEDDED_JS_BUNDLE stuck)

## Summary
Downgrade testing forced `FORCE_EMBEDDED_JS_BUNDLE` to keep Hermes stable while Metro was broken. Debug runs now skip the packager entirely, so sockets on ports 8081/8097 never open and developers cannot leverage live reload, dev menus, or LogBox. This playbook documents how to get Metro healthy again and only fall back to the embedded bundle when explicitly requested.

## Symptoms
- Xcode console prints `[AppDelegate] FORCE_EMBEDDED_JS_BUNDLE enabled - loading embedded bundle` on every debug run even when Metro is running locally.
- Device logs show `warning: ... empty dSYM file detected` because the embedded Release bundle is being loaded inside the Debug build.
- Metro CLI shows no incoming websocket connections; the app also warns that it "refused connections" to ports 8081/8097.
- Changes to JS never reach the device unless `npx react-native bundle` is rerun and the app is rebuilt.

## Likely Root Causes
1. `FORCE_EMBEDDED_JS_BUNDLE` is still set to `1` in the shared Xcode scheme (`apps/mobile/ios/MinimumStandardsMobile.xcodeproj/xcshareddata/xcschemes/MinimumStandardsMobile.xcscheme`).
2. An old Metro instance is wedged or pointing at a stale cache, so React Native automatically switches to the embedded bundle path.
3. The "Start Packager" build phase was disabled while iterating on embedded bundles.
4. `.xcode.env` (or local shell) points `NODE_BINARY` somewhere invalid so the packager never launches successfully.

## Remediation
1. **Clear forced embed flag**
   - In Xcode: *Product → Scheme → Edit Scheme → Run → Environment Variables* and delete `FORCE_EMBEDDED_JS_BUNDLE`, or set it to `0`.
   - For CLI workflows, run `unset FORCE_EMBEDDED_JS_BUNDLE` (zsh) before `npx react-native run-ios`.
2. **Restart Metro from a clean cache**
   ```bash
   cd apps/mobile
   rm -rf /tmp/metro-* && watchman watch-del-all || true
   NODE_OPTIONS=--max_old_space_size=4096 npx react-native start --reset-cache
   ```
3. **Re-enable the Start Packager phase**
   - Open the Xcode project, select the app target → *Build Phases*, and make sure "Start Packager" is checked for the Debug configuration.
4. **Verify `.xcode.env`**
   - Confirm `apps/mobile/ios/.xcode.env` exports the correct `NODE_BINARY`. This should match the Node version you use locally (e.g., `/opt/homebrew/bin/node`).
5. **Only embed intentionally**
   - When you truly need to run without Metro (CI, release smoke tests), set `FORCE_EMBEDDED_JS_BUNDLE=1` for that single run or duplicate the scheme instead of toggling it globally.

## Verification
- Launch `npx react-native run-ios --device "<device>"` with Metro already running. Xcode should log `Using Metro bundle at: ...` instead of the embedded bundle message.
- Shake the device (or use `Cmd+D`) to confirm the dev menu opens, proving the app is attached to Metro.
- Kill Metro while the app is open; you should now see the expected red screen/logbox rather than silently continuing to use a stale bundle.

## References
- `apps/mobile/ios/MinimumStandardsMobile/AppDelegate.swift` shows how the `FORCE_EMBEDDED_JS_BUNDLE` flag changes bundle resolution.
- `troubleshooting/react-native-ios-blank-screen-metro.md` contains historical context on embedded bundles vs. Metro.
