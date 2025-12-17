# React Navigation warning: duplicate "Settings" screen names

## Summary
React Navigation logs `Screen name 'Settings' is already defined in the navigator` because the bottom tab navigator and the nested settings stack both register a route named `Settings`. The framework uses route names as dictionary keys, so duplicates cause unpredictable state restoration and deep linking bugs.

## Symptoms
- Yellow-box warning every time navigation mounts: `Screen name 'Settings' is already defined`.
- Navigating back from nested settings screens sometimes pops the wrong stack or leaves headers hidden.
- Deep links targeting `Settings` may resolve to the tab instead of the stack (or vice versa).

## Root Cause
- `apps/mobile/src/navigation/BottomTabNavigator.tsx` declares `<Tab.Screen name="Settings" ... />`.
- `apps/mobile/src/navigation/SettingsStack.tsx` sets `initialRouteName="Settings"` and registers `<Stack.Screen name="Settings" ... />`.
- React Navigation expects unique route names within each navigator tree; nested stacks can reuse names only if they are not siblings of one another. In this case the tab and the stack share the same parent (MainStack -> Tab + nested stack), so the warning fires.

## Remediation
1. **Rename the tab**
   - Update `BottomTabParamList` (in `apps/mobile/src/navigation/types.ts`) to use `SettingsTab`.
   - Change `<Tab.Screen name="Settings" ...>` to `name="SettingsTab"` and keep `tabBarLabel="Settings"` so the UI remains unchanged.
2. **Rename the stack route**
   - Set `initialRouteName="SettingsRoot"` in `SettingsStack.tsx` and rename the screen to `SettingsRoot`.
   - Export a strongly-typed constant for the screen name if needed.
3. **Update navigation callers**
   - Any `navigation.navigate('Settings')` calls should now target `'SettingsTab'` (to switch tabs) or `'SettingsRoot'` (to push onto the stack).
   - Update deep-link config if it references `Settings`.
4. **Fix tests**
   - Adjust Jest/navigation tests under `apps/mobile/src/navigation/__tests__` to reference the new route names and keep snapshots up to date.

## Verification
- Run the app; the duplicate-screen warning should disappear.
- Switch between tabs and nested screens to ensure navigation still works.
- Run `npm run test` to update navigation snapshots and ensure no stale route names remain.

## References
- `apps/mobile/src/navigation/BottomTabNavigator.tsx`
- `apps/mobile/src/navigation/SettingsStack.tsx`
- `apps/mobile/src/navigation/types.ts`
- React Navigation docs on screen names: https://reactnavigation.org/docs/nesting-navigators/#screen-names
