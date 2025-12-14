# Specification: User authentication flows

## Goal
Implement a complete authentication system with Firebase Auth that manages user sign up, sign in, password reset, and sign out, while ensuring protected navigation routes and proper auth state initialization before app navigation.

## User Stories
- As a new user, I want to create an account with email/password or sign in with Google so that I can access my private performance tracking data.
- As a user, I want to reset my password if I forget it so that I can regain access to my account.
- As a user, I want to sign out securely so that my data remains protected when I'm not using the app.
- As a developer, I want auth state properly initialized before navigation so that users don't see protected content before authentication is verified.

## Specific Requirements

**Auth state management with Zustand**
- Create Zustand store (`src/stores/authStore.ts`) that wraps Firebase Auth's `onAuthStateChanged` listener
- Store current user (`FirebaseAuthTypes.User | null`) and initialization state (`isInitialized: boolean`)
- Subscribe to auth state changes on app mount and update store accordingly
- Follow existing Zustand patterns from `standardsBuilderStore.ts` (use `create` with typed interface)
- Expose hook `useAuthStore()` for components to access auth state

**Auth initialization loading screen**
- Show loading/splash screen while `isInitialized === false` in auth store
- Wait for Firebase Auth's `onAuthStateChanged` to fire at least once before rendering main navigation
- Prevent flash of unauthenticated content by blocking navigation until auth state is known
- Use simple loading indicator consistent with app's existing styling patterns

**Sign up flow (email/password)**
- Create `SignUpScreen` component with email, password, and password confirmation fields
- Use React Hook Form for form management with Zod schema validation
- Validate email format, password strength (minimum length), and password match
- Show field-level error messages using existing `AuthError` class for Firebase errors
- On successful sign up, automatically sign user in and navigate to main app
- Keep sign up minimal MVP (no additional user profile information collection)

**Sign in flow (email/password + Google OAuth)**
- Create `SignInScreen` component with email and password fields
- Use React Hook Form + Zod validation for email/password inputs
- Add "Sign in with Google" button that uses Firebase's Google Sign-In (already configured)
- Show error messages using `AuthError` class with user-friendly messages
- On successful sign in, navigate to main app
- Include "Forgot password?" link that navigates to password reset screen

**Password reset flow**
- Create `PasswordResetScreen` component with email input field
- Use React Hook Form + Zod for email validation
- Call Firebase Auth's `sendPasswordResetEmail` when form submitted
- Show success message after email is sent (email provider already enabled in Firebase Console)
- Navigate back to sign in screen after successful submission
- Email-based reset only (no deep linking required for MVP)

**React Navigation migration and protected routes**
- Install React Navigation packages (`@react-navigation/native`, `@react-navigation/native-stack`, `react-native-screens`)
- Replace current state-based navigation (`RootView` type) with React Navigation's native-stack navigator
- Create navigation structure: Auth stack (SignIn, SignUp, PasswordReset) and Main stack (existing screens)
- Implement navigation guards that redirect unauthenticated users to auth screens
- Use conditional rendering based on auth state to show appropriate stack
- Ensure all existing screens (Home, Dashboard, Library, Builder, etc.) remain accessible in main stack

**Settings screen with sign out**
- Create `SettingsScreen` component accessible from main navigation
- Add "Sign Out" button that calls Firebase Auth's `signOut()` method
- Clear auth state in Zustand store on sign out
- Navigate to sign in screen after successful sign out
- Follow existing screen styling patterns (header with back button, card-based layout)

**Error handling and logging**
- Use existing `AuthError` class from `apps/mobile/src/utils/errors.ts` consistently across all auth flows
- Map Firebase Auth error codes to user-friendly messages via `AuthError.fromFirebaseError()`
- Log auth errors to Crashlytics per error handling standards (include user ID if available)
- Show clear, actionable error messages to users (hide technical Firebase error codes)
- Handle network errors gracefully with retry suggestions

**Firestore security rules enforcement**
- Ensure all Firestore reads/writes require authentication (rules already enforce `isSignedIn()` and `isOwner(uid)`)
- Verify that unauthenticated users cannot access any user-scoped collections
- Test that auth state changes properly trigger Firestore permission checks
- Ensure auth state is available before any Firestore queries execute

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**`apps/mobile/src/utils/errors.ts` - AuthError class**
- Reuse `AuthError` class and `AuthError.fromFirebaseError()` method for consistent error handling
- Use existing error message mapping (`getAuthErrorMessage`) for user-friendly messages
- Follow error handling patterns established in this utility

**`apps/mobile/src/stores/standardsBuilderStore.ts` - Zustand store pattern**
- Follow Zustand store structure: typed interface, `create` function, initial state, and action methods
- Use same file organization and naming conventions (`useAuthStore` hook)
- Place auth store in `src/stores/` directory per coding standards

**Form validation patterns from existing screens**
- Follow React Hook Form patterns used in `ActivityModal.tsx` and `LogEntryModal.tsx` (though these use manual state, migrate to React Hook Form)
- Use Zod schemas for validation consistent with tech stack requirements
- Follow existing form styling patterns (input fields, error messages, button styles)

**Screen component styling patterns**
- Follow existing screen structure: header with back button, content area, card-based layouts
- Use consistent `StyleSheet.create` patterns from `StandardsBuilderScreen.tsx` and `ActiveStandardsDashboardScreen.tsx`
- Match color scheme (`#0F62FE` for primary actions, `#f7f8fa` for backgrounds)
- Use `SafeAreaView` and `SafeAreaProvider` for proper safe area handling

## Out of Scope
- Additional user profile information collection during sign up (display name, avatar, etc.)
- Deep linking for password reset emails (email-based reset sufficient for MVP)
- Other OAuth providers beyond Google (Apple Sign-In, Facebook, etc.)
- Email verification flow (not required for MVP)
- Account deletion or profile management features
- Multi-factor authentication (MFA)
- Remember me / persistent session options beyond Firebase's default persistence
- Social account linking (linking Google account to existing email account)
- Password change flow (users can use password reset instead)
