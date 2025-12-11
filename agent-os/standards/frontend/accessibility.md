## Accessibility best practices (React Native)

> Always consult `profiles/react-firebase/standards/global/tech-stack.md` for the authoritative list of libraries (navigation, styling, safe-area helpers, etc.). Update that file first if the stack changes; this document describes how to apply whichever tools are defined there.

- **Meaningful labels**: Set `accessibilityLabel`, `accessibilityHint`, and `accessibilityRole` on custom components; wrap complex UIs in `<View accessible>` to group related elements.
- **Consistent focus order**: Mark interactive elements with `focusable` and manage focus with `AccessibilityInfo.setAccessibilityFocus` when modals, drawers, or toasts appear.
- **Touch targets**: Keep tap targets ≥44x44 dp and respect platform-specific gestures; use `Pressable` or `TouchableOpacity` with `hitSlop` where needed.
- **Color & contrast**: Follow WCAG 2.1 contrast ratios and verify in both light/dark themes; avoid conveying state with color alone.
- **Dynamic text**: Honor system font scaling by using `StyleSheet` values derived from `PixelRatio` or `react-native-size-matters`; test with large text enabled.
- **Screen reader coverage**: Test VoiceOver (iOS) and TalkBack (Android) for accurate reading order, rotor navigation, and correct announcements for live regions via `accessibilityLiveRegion`.
- **Platform semantics**: Prefer `Text`, `Button`, `Switch`, etc., over div-like `View` wrappers so native traits map correctly; expose headings via `accessibilityRole="header"`.
- **Reduced motion & haptics**: Respect user settings from `AccessibilityInfo.isReduceMotionEnabled()` and gate haptics or animations accordingly.
- **Safe areas**: Combine the safe-area provider defined in the tech stack (currently `react-native-safe-area-context`) with accessibility insets so content isn’t obscured by notches or home indicators, especially for assistive tech users.
