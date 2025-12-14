# Task Group 1 – Auth State Layer

## Scope
- Zustand auth store (`apps/mobile/src/stores/authStore.ts`) manages authentication state and subscribes to Firebase Auth's `onAuthStateChanged` listener
- Auth initialization hook (`apps/mobile/src/hooks/useAuthInitialization.ts`) sets up the auth state listener on app mount
- Store tracks `user: FirebaseAuthTypes.User | null` and `isInitialized: boolean` to prevent flash of unauthenticated content
- Loading screen component (`apps/mobile/src/components/LoadingScreen.tsx`) displays while auth state initializes

## Implementation Notes
- Auth store uses Zustand pattern consistent with `standardsBuilderStore.ts`
- Store's `initialize()` method sets up `onAuthStateChanged` listener and prevents duplicate listeners
- First auth state change sets `isInitialized: true`, ensuring navigation waits for auth verification
- `useAuthInitialization` hook calls store's `initialize()` method and handles cleanup on unmount
- Loading screen shows "Loading..." text while `isInitialized === false`

## Verification
- `npm --prefix apps/mobile run lint` (passes)
- `npm --prefix apps/mobile run typecheck` (passes)
- `npm --prefix apps/mobile test src/stores/__tests__/authStore.test.ts` (passes)
- `npm --prefix apps/mobile test src/hooks/__tests__/useAuthInitialization.test.ts` (passes)

## Risks & Follow-ups
- Store initialization prevents duplicate listeners, but cleanup should be called when app unmounts to avoid memory leaks
- Auth state listener persists across app lifecycle, which is correct behavior for Firebase Auth
