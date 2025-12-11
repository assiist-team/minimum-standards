## Coding style best practices (React Native + Firebase)

> This guidance assumes the stack choices listed in `profiles/react-firebase/standards/global/tech-stack.md`. When those choices change, update that file first so every reference here stays accurate.

- **TypeScript strictness**: Keep `strict: true`, `noImplicitAny`, and `exactOptionalPropertyTypes` enabled in both app and Cloud Functions tsconfig files. Prefer explicit return types for exported functions/hooks.
- **File naming**: Use PascalCase for components (`ProfileScreen.tsx`), camelCase for hooks/utilities, and platform extensions when behavior diverges (`DateInput.ios.tsx`, `.android.tsx`). Keep Cloud Functions handlers in kebab-case folders (`users-create/handler.ts`).
- **Module structure**: Group React Native code under `src/` by feature (`src/features/auth`) with colocated hooks, components, and tests. Keep shared schemas/types in `packages/shared/`.
- **Imports**: Use absolute imports via `tsconfig` path aliases (`@app/components/Button`). Order imports: React/React Native, third-party libs, internal modules, relative paths.
- **Hooks & state**: Prefix custom hooks with `use` and keep hook bodies pure; Zustand stores live under `src/stores/` with `createStore` composition.
- **Styling**: Define `styles` via `StyleSheet.create` near the bottom of the file; avoid inline style literals inside JSX unless they depend on props.
- **Logging**: Use a centralized logger (e.g., `@app/utils/logger`) that forwards important errors to Crashlytics/Sentry. Strip `console.log` before release builds.
- **Dead code & comments**: Delete unused styles/components/tests immediately. Comments should explain *why* something exists, not restate what the code does.
- **Cloud Functions layout**: Export one handler per file, keep pure logic separated so it’s testable without Firebase context, and avoid mutable module-level state.
