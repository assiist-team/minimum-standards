# Android nav bar overlay issue

## Problem
On Android emulator (API 36), the system navigation bar is overlaying the app's bottom tab bar, cutting the tab icons and labels in half.

## Status
- The nav bar is still overlaying the bottom tab bar in the Android emulator.
- Visual result after each change: **no visible change**.
- All experimental code/theme changes listed below were reverted after failing to fix the issue unless noted otherwise.
- Pro plan implementation done: safe-area inset logging + `setDecorFitsSystemWindows(false)`.
- Safe-area bottom inset is non-zero (e.g. 24) but UI still overlaps.
- We attempted multiple React Navigation safe-area fixes (detailed below) and saw **no visible change after a dev reload (`r` twice)**.
- Latest attempt: re-apply **#5 (opaque nav bar theme)**, then **uninstall + rebuild/reinstall**.
- **Outcome**: still not fixed.

## What we learned from React Navigation source (relevant facts)
From `@react-navigation/bottom-tabs` source:
- `BottomTabBar` computes `paddingBottom` from the `insets.bottom` it receives.
- `tabBarStyle` is applied **last**, so `tabBarStyle.paddingBottom` will override the computed safe-area padding.
- `BottomTabBar` also computes a `tabBarHeight` from the same insets, and uses it as the view’s `height`.

Implication:
- Overriding `paddingBottom` in `tabBarStyle` can cancel safe-area behavior.
- But even after removing that override and/or feeding larger insets, we still saw no UI change on API 36 (so the issue likely isn’t just “tab bar padding math”).

## What we tried (chronological)
1) **JS-side padding/height adjustments**
- Increased tab bar height and bottom padding on Android to account for the gesture bar.
- Result: no visible change.
- Reverted: yes.

2) **Native window fitting (MainActivity)**
- Added `WindowCompat.setDecorFitsSystemWindows(window, true)` in `onCreate`.
- Result: no visible change.
- Reverted: yes.

3) **Re-assert window fitting**
- Added `WindowCompat.setDecorFitsSystemWindows(window, true)` in `onResume` to avoid runtime edge-to-edge toggles.
- Result: no visible change.
- Reverted: yes.

4) **Android 15 edge-to-edge opt-out**
- Added `android:windowOptOutEdgeToEdgeEnforcement="true"` on `MainActivity`.
- Result: no visible change.
- Reverted: yes.

5) **Opaque navigation bar theme**
- Set `android:windowTranslucentNavigation` to `false`.
- Set `android:navigationBarColor` and added `navigation_bar` color resources for light and dark.
- Verification method: uninstall + rebuild/reinstall.
- Result: **no visible change** (still overlapped).
- Reverted: no (currently applied).

6) **Full Android rebuilds**
- Performed full Android rebuilds after native and manifest changes.
- Result: app installs and launches, UI still looks the same.

7) **Removing hardcoded BottomTabNavigator height**
- Removed `height: Platform.OS === 'ios' ? 88 : 64` in favor of `height: Platform.OS === 'ios' ? 88 : undefined` to allow the tab bar to grow with safe area padding.
- Result: no visible change.
- Reverted: yes.

8) **Android tab bar minHeight from insets**
- Kept Android `height` unset and applied `minHeight = baseTabBarHeight + max(bottomInset, 8)` so the bar can grow with the safe-area inset.
- Result: no visible change after quick reload.
- Reverted: yes (replaced by wrapper padding approach).

9) **Move bottom inset to tab bar wrapper**
- Shifted bottom inset handling to `TabBarWithStickyLogButton` container via `paddingBottom`, keeping the outer wrapper opaque and tall enough.
- Result: no visible change after quick reload.
- Reverted: yes (replaced by Spacer View).

10) **Explicit Spacer View**
- Added a `View` with `height={insets.bottom}` below the `BottomTabBar` inside the wrapper.
- Removed wrapper padding.
- Goal: force physical space under the tab bar.
- Result: **no visible change**.
- Reverted: yes.

11) **Attempted fix: include `insets.bottom` in `tabBarStyle.paddingBottom`**
- Change: set `tabBarStyle.paddingBottom = Math.max(insets.bottom, basePadding)` (basePadding = 8 Android / 20 iOS).
- Rationale: `tabBarStyle` overrides React Navigation’s computed padding, so include the inset explicitly.
- Verification method: dev reload (`r` twice).
- Result: **no visible change**.
- Reverted: yes (replaced by passing `safeAreaInsets`).

12) **Attempted fix: pass `safeAreaInsets` to `Tab.Navigator`**
- Change: set `safeAreaInsets.bottom = insets.bottom + basePadding` (basePadding = 8 Android / 20 iOS), and removed `tabBarStyle.paddingBottom` override.
- Rationale: React Navigation uses insets to compute both the tab bar’s **padding** and its **height**; passing larger insets should lift the whole bar.
- Verification method: dev reload (`r` twice).
- Result: **no visible change**.
- Reverted: yes (removed when switching back to native fitting attempt).

13) **Attempted fix: let Android fit system windows (`decorFitsSystemWindows = true`)**
- Change (native): set `WindowCompat.setDecorFitsSystemWindows(window, true)` in `MainActivity.onCreate`.
- Also: removed custom `safeAreaInsets` override from `BottomTabNavigator` to avoid double-applying.
- Rationale: if the app is drawing under the system nav bar on API 35/36, letting Android reserve inset space is the simplest way to stop overlap (especially if the nav bar is effectively overlaying content).
- Verification method: uninstall + rebuild/reinstall (native change; dev reload is insufficient).
- Result: **still not fixed** (system navigation bar still overlaps bottom tab bar).
- Reverted: no (current code as of this writing).

## Proposed "Pro" Plan (Next Steps)
1. **Instrument & Verify Data**: Log `useSafeAreaInsets()` in `BottomTabNavigator` to see if the app is even receiving a `bottom` inset value. (Implemented)
   - If `0`: The native window configuration is failing to report insets to React Native.
   - If `> 0`: The layout logic is receiving the value but failing to apply it (e.g. height constraints).
2. **Correct Native Configuration**: Explicitly set `WindowCompat.setDecorFitsSystemWindows(window, false)` in `MainActivity`. (Implemented)
   - *Why*: The previous attempt used `true` (asking system to fit), but API 35+ enforces edge-to-edge. Setting it to `false` (standard modern approach) tells the system "Let the app handle the insets," which allows `react-native-safe-area-context` to correctly measure the bars and provide the padding values we need.

## Evidence (current code + runtime)
- `SafeAreaProvider` wraps the app root (`apps/mobile/App.tsx`), so safe-area insets should be available to navigation components.
- Runtime log shows non-zero insets: `[BottomTabNavigator] safe area insets { left: 0, bottom: 24, right: 0, top: 24 }`.
- `BottomTabBar` does receive non-zero insets, but even when we fed larger insets and/or included `insets.bottom` in padding, the UI still appeared unchanged on API 36.
- Even after switching to `setDecorFitsSystemWindows(true)` and reinstalling, the overlap persisted (suggesting edge-to-edge behavior is still active or insets are not being applied as expected).

## Why the overlay MAY persists (weak hypothesis)
The emulator is Android 15/16 behavior (API 35/36) where **edge-to-edge is enforced** for apps targeting 35+. Even with `setDecorFitsSystemWindows(false)` (letting the app handle insets), the system can keep drawing the nav bar *over* the app content unless the window is configured to reserve opaque space for system bars.

In other words:
- `setDecorFitsSystemWindows(true)` tries to keep content out of system bars.
- But if the system bars are **translucent**, content still renders underneath.
- That makes the navigation bar visually overlap the tab bar, even if we add padding in JS.

## Why an opaque navigation bar might help (weak hypothesis)
We already tried forcing an opaque navigation bar and saw **no visible change**, so this is currently a weak hypothesis.
That said, making the navigation bar **opaque** (non-translucent) changes how the system composes the window:

- **Translucent bars**: the system draws app content *behind* the bars. This is the exact overlay you are seeing.
- **Opaque bars**: the system draws bars *above* a reserved inset area, so app content does not render underneath.

If the nav bar is opaque:
- The OS reserves space for it.
- The system bar no longer visually covers app UI.
- The bottom tab bar remains fully visible without needing ad‑hoc padding.

This is the standard Android approach for preventing content overlap when edge-to-edge is enforced and you **do not** want content behind system bars. It is not specific to React Native and does not affect iOS.

## Native theme change we implemented (current)
We added a navigation bar color and made it non‑translucent in the Android theme to force the nav bar to occupy its own space rather than overlaying UI. This change is currently applied and still did not fix the overlap.

Example (previously implemented in `android/app/src/main/res/values/styles.xml`):

```xml
<style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
    <item name="android:editTextBackground">@drawable/rn_edit_text_material</item>
    <item name="android:navigationBarColor">@color/navigation_bar</item>
    <item name="android:windowTranslucentNavigation">false</item>
</style>
```

Defined `@color/navigation_bar` (matching the tab bar background) in:
- `android/app/src/main/res/values/colors.xml` (light)
- `android/app/src/main/res/values-night/colors.xml` (dark)

## Why this does not affect iOS
These changes are Android-only resources and theme settings. iOS uses separate UIKit settings and is not impacted by Android theme attributes.
