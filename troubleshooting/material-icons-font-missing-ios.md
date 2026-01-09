# `Unrecognized font family 'Material Icons'`

## Summary
After downgrading to React Native 0.76.5, iOS builds stopped bundling the Material Icons typeface that `react-native-vector-icons/MaterialIcons` relies on. The app now renders tab icons as blank squares and spam-warns `Unrecognized font family 'Material Icons'` on every navigation render.

## Symptoms
- Console spam: `Unrecognized font family 'Material Icons'` when `BottomTabNavigator` renders.
- Tabs show fallback glyphs or nothing at all.
- `react-native-vector-icons` styles still resolve (no TypeScript errors), proving the JS import works while the native font asset is missing.

## Root Cause
- The downgrade reset `ios/Pods` and the derived data cache, removing previously linked font resources.
- `react-native-vector-icons` requires the font files to be copied into the iOS bundle and declared under the `UIAppFonts` array inside `Info.plist`. Without those entries, UIFont cannot resolve `MaterialIcons-Regular.ttf`.

## Remediation
1. **Re-run asset linking**
   ```bash
   cd apps/mobile
   npx react-native-asset
   ```
   This copies `node_modules/react-native-vector-icons/Fonts/*` into `ios/` and updates `Info.plist` if configured.
2. **Ensure fonts are listed in Info.plist**
   - Open `apps/mobile/ios/MinimumStandardsMobile/Info.plist`.
   - Under `Fonts provided by application (UIAppFonts)`, add:
     - `MaterialIcons.ttf`
     - (Optional) any other icon packs you use.
3. **Verify the Xcode build phase**
   - Target → *Build Phases* → *Copy Bundle Resources* should include the `.ttf` files.
4. **Clean + rebuild**
   ```bash
   cd apps/mobile/ios
   xcodebuild -workspace MinimumStandardsMobile.xcworkspace -scheme "MinimumStandardsMobile (Embedded)" -configuration Debug -destination 'generic/platform=iOS' clean build
   ```
   Swap the scheme for `MinimumStandardsMobile (Fast Refresh)` if you only need a Metro dev build. Or simply *Product → Clean Build Folder* inside Xcode, then run again.

## Verification
- Launch the app; tab icons should render immediately without warnings.
- Inspect the device log to confirm the warning is gone.
- `UIFont` debugging (`po UIFont.familyNames()` in Xcode) should list `Material Icons`.

## References
- `apps/mobile/src/navigation/BottomTabNavigator.tsx` imports `MaterialIcons`.
- `react-native-vector-icons` linking guide: https://github.com/oblador/react-native-vector-icons#installation
