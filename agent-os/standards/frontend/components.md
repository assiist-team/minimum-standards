## Component best practices (React Native)

> Stack guardrail: follow the tooling defined in `profiles/react-firebase/standards/global/tech-stack.md` (navigation, state, styling, testing). If the stack evolves, update that file first so these conventions remain accurate.

- **Single responsibility**: Keep components focused on one job (view, layout, control). Extract hooks for logic and leave rendering inside the component tree.
- **Typed props**: Define `Props` interfaces with TypeScript, provide sensible defaults, and avoid optional props when a default would suffice.
- **Composition first**: Compose primitives (`Pressable`, `Text`, `View`) into reusable building blocks. Reach for inheritance or `forwardRef` only when necessary.
- **Platform awareness**: Hide platform-specific differences behind the component interface (`Platform.select`, `.ios.tsx/.android.tsx`) so callers stay simple.
- **Limited state**: Keep state local; promote to Zustand or React Query only when it truly needs to be shared or cached.
- **Performance**: Use `React.memo`, `useCallback`, and `useMemo` judiciously on frequently rendered lists; prefer `FlashList`/`FlatList` with `keyExtractor`.
- **Accessibility built-in**: Components must forward `accessibility*` props and sensible `testID`s so screens stay consistent.
- **Styling boundaries**: Accept a small set of style-related props (variant, size) rather than arbitrary style overrides; convert to actual RN styles internally.
- **Documentation & examples**: Provide Storybook/MDX examples or inline usage snippets so product/design can verify expectations quickly.
