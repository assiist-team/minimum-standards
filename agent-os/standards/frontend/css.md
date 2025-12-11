## Styling best practices (React Native)

> Use the styling approach captured in `profiles/react-firebase/standards/global/tech-stack.md` (currently NativeWind + `StyleSheet`). Update that document before swapping frameworks so these notes stay current.

- **Design tokens first**: Centralize color, typography, spacing, and radius tokens in a theme module; export helpers so both JS styles and NativeWind classes stay in sync.
- **Use `StyleSheet.create`**: Define base styles via `StyleSheet.create` (or `tailwind.config.js` when using NativeWind) to enable validation and avoid inline objects inside render paths.
- **Utility layer**: Favor the utility framework specified in the tech stack (currently NativeWind) for rapid iteration, but fall back to StyleSheet entries for complex cases. Avoid mixing multiple styling paradigms inside a single component.
- **Flexbox layouts**: Lean on RN Flexbox + `gap` via NativeWind for layout; avoid absolute positioning unless required.
- **Platform-specific tweaks**: Use `Platform.select` or `.android/.ios` style files for divergent paddings, shadows, or fonts instead of conditional logic scattered through JSX.
- **Responsive helpers**: Derive sizes from `Dimensions`, `useWindowDimensions`, or `react-native-responsive-dimensions` so components adapt gracefully to tablets.
- **Safe areas & status bars**: Wrap screens with `SafeAreaView`/`SafeAreaProvider` and keep backgrounds extending into system bars for a polished feel.
