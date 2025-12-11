## Responsive layout best practices (React Native)

> See `profiles/react-firebase/standards/global/tech-stack.md` for the official device support list and responsive helpers. Update that file first if targets or libraries change.

- **Device classes**: Treat phones (<600dp width) and tablets (≥600dp) as primary breakpoints. Use `useWindowDimensions` or the responsive helper specified in the tech stack (currently `react-native-responsive-dimensions`) to switch layouts.
- **Flex-first**: Build flexible layouts with Flexbox, percentage widths, and intrinsic sizing rather than fixed pixel values.
- **Safe area awareness**: Wrap top-level screens in `SafeAreaView`/`SafeAreaProvider` and pad scroll views so content never hides behind notches or gesture bars.
- **Adaptive typography**: Scale text with helpers like `moderateScale` or `PixelRatio` so copy remains legible without manual per-device overrides.
- **Media & assets**: Serve appropriately sized images via `Image` source sets (e.g., `@2x`, `@3x`) and prefer vector assets (`react-native-svg`) to keep bundles small.
- **Orientation handling**: Respond to rotation changes with `useDeviceOrientation` or `Dimensions.addEventListener`; lock orientation only when UX requires it.
- **Testing matrix**: Verify each screen on iPhone SE, iPhone Pro Max, iPad, small Android (360dp), and large Android tablet to catch layout regressions early.
