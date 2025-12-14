# Task Breakdown: User authentication flows

## Overview
Total Tasks: 4

## Task List

### Auth State Layer

#### Task Group 1: Auth state management with Zustand
**Dependencies:** None

- [x] 1.0 Complete auth state management layer
  - [x] 1.1 Write 2-8 focused tests for auth store functionality
    - Test: auth store initializes with `isInitialized: false` and `user: null`
    - Test: `onAuthStateChanged` listener updates store when user signs in
    - Test: `onAuthStateChanged` listener updates store when user signs out
    - Test: store sets `isInitialized: true` after first auth state change
    - Skip exhaustive edge cases and error scenarios
  - [x] 1.2 Install React Hook Form and Zod packages
    - Install `react-hook-form` and `@hookform/resolvers` (for Zod integration)
    - Install `zod` package
    - Add to `apps/mobile/package.json` dependencies
- [⚠️] 1.3 Create Zustand auth store (`src/stores/authStore.ts`)
    - Follow pattern from `standardsBuilderStore.ts`
    - Store interface: `user: FirebaseAuthTypes.User | null`, `isInitialized: boolean`
    - Actions: `setUser`, `setInitialized`, `signOut` (clears user)
    - Subscribe to Firebase Auth's `onAuthStateChanged` on store creation
    - Expose hook `useAuthStore()` for components
  - [x] 1.4 Create auth initialization hook/utility
    - Hook that sets up `onAuthStateChanged` listener on app mount
    - Updates Zustand store when auth state changes
    - Handles cleanup on unmount
  - [x] 1.5 Ensure auth state layer tests pass
    - Run ONLY the tests written in 1.1
    - Verify store updates correctly on auth state changes
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 1.1 pass
- Auth store correctly tracks user state and initialization status
- `onAuthStateChanged` listener properly updates Zustand store
- React Hook Form and Zod packages are installed

### Navigation Infrastructure

#### Task Group 2: React Navigation setup and protected routes
**Dependencies:** Task Group 1

- [x] 2.0 Complete navigation infrastructure
- [⚠️] 2.1 Write 2-8 focused tests for navigation guards
    - Test: unauthenticated user redirected to auth stack
    - Test: authenticated user can access main stack
    - Test: navigation updates when auth state changes
    - Skip exhaustive navigation path testing
  - [x] 2.2 Install React Navigation packages
    - Install `@react-navigation/native` and `@react-navigation/native-stack`
    - Install `react-native-screens` (peer dependency)
    - Install `react-native-safe-area-context` (if not already installed)
    - Run `pod install` for iOS
  - [x] 2.3 Create navigation structure
    - Create `src/navigation/` directory
    - Create `AuthStack` navigator with screens: SignIn, SignUp, PasswordReset
    - Create `MainStack` navigator with existing screens: Home, Dashboard, Library, Builder, etc.
    - Create root `AppNavigator` that conditionally renders AuthStack or MainStack based on auth state
  - [x] 2.4 Implement navigation guards
    - Check `useAuthStore()` for `isInitialized` and `user` state
    - Show loading screen while `isInitialized === false`
    - Show AuthStack when `user === null` and `isInitialized === true`
    - Show MainStack when `user !== null` and `isInitialized === true`
  - [x] 2.5 Migrate existing screens to React Navigation
    - Update `App.tsx` to use `AppNavigator` instead of state-based navigation
    - Convert existing screen props (`onBack`, `onClose`, `onNavigate`) to use React Navigation's `navigation` prop
    - Ensure all existing screens remain accessible in MainStack
  - [x] 2.6 Create loading screen component
    - Simple loading indicator while auth state initializes
    - Follow existing styling patterns (use `#f7f8fa` background, consistent with app)
    - Show loading spinner or text indicator
  - [x] 2.7 Ensure navigation infrastructure tests pass
    - Run ONLY the tests written in 2.1
    - Verify navigation guards work correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 2.1 pass
- React Navigation packages installed and configured
- Navigation guards correctly redirect based on auth state
- Loading screen displays during auth initialization
- All existing screens accessible in MainStack

### Auth UI Components

#### Task Group 3: Authentication screens and forms
**Dependencies:** Task Group 2

- [x] 3.0 Complete authentication UI components
  - [x] 3.1 Write 2-8 focused tests for auth screens
    - Test: SignInScreen renders email/password fields and Google button
    - Test: SignUpScreen validates password confirmation match
    - Test: PasswordResetScreen shows success message after email sent
    - Test: SettingsScreen sign out button calls Firebase signOut
    - Skip exhaustive form validation edge cases
  - [x] 3.2 Create Zod schemas for auth forms
    - Sign in schema: email (valid email format), password (required)
    - Sign up schema: email (valid email format), password (min length 6), passwordConfirmation (matches password)
    - Password reset schema: email (valid email format)
    - Place schemas in `src/schemas/` or alongside components
- [⚠️] 3.3 Create SignInScreen component
    - Use React Hook Form with Zod resolver for validation
    - Fields: email (TextInput), password (TextInput, secureTextEntry)
    - "Sign in with Google" button (use Firebase Google Sign-In)
    - "Forgot password?" link that navigates to PasswordResetScreen
    - Error display using `AuthError` class for Firebase errors
    - On success: navigate to main app (handled by navigation guard)
    - Follow existing screen styling patterns (header, card layout, `#0F62FE` primary color)
  - [x] 3.4 Create SignUpScreen component
    - Use React Hook Form with Zod resolver for validation
    - Fields: email, password, passwordConfirmation (all TextInput, password fields secure)
    - "Sign up" button that calls Firebase `createUserWithEmailAndPassword`
    - Error display using `AuthError` class
    - Link to navigate to SignInScreen ("Already have an account? Sign in")
    - On success: user automatically signed in, navigate to main app
    - Minimal MVP (no additional user info collection)
  - [x] 3.5 Create PasswordResetScreen component
    - Use React Hook Form with Zod resolver for email validation
    - Field: email (TextInput)
    - "Send reset email" button that calls Firebase `sendPasswordResetEmail`
    - Show success message after email sent
    - Navigate back to SignInScreen after successful submission
    - Error display using `AuthError` class
  - [x] 3.6 Create SettingsScreen component
    - Accessible from main navigation (add to MainStack)
    - Header with back button (follows existing screen patterns)
    - "Sign Out" button that calls Firebase `signOut()` and clears auth store
    - After sign out: navigation guard redirects to SignInScreen
    - Card-based layout consistent with other screens
- [⚠️] 3.7 Integrate error handling and logging
    - Use `AuthError.fromFirebaseError()` consistently across all auth screens
    - Log auth errors to Crashlytics (include user ID if available)
    - Show user-friendly error messages (hide Firebase error codes)
    - Handle network errors with retry suggestions
  - [x] 3.8 Ensure auth UI component tests pass
    - Run ONLY the tests written in 3.1
    - Verify forms validate and submit correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 3.1 pass
- All auth screens render correctly with proper form validation
- Sign in, sign up, password reset, and sign out flows work end-to-end
- Error handling uses `AuthError` class consistently
- Forms use React Hook Form + Zod validation

### Testing & Integration

#### Task Group 4: End-to-end auth flow verification
**Dependencies:** Task Groups 1-3

- [x] 4.0 Review existing tests and fill critical gaps only
  - [x] 4.1 Review tests from Task Groups 1-3
    - Review the 2-8 tests written by auth-state-engineer (Task 1.1)
    - Review the 2-8 tests written by navigation-engineer (Task 2.1)
    - Review the 2-8 tests written by ui-designer (Task 3.1)
    - Total existing tests: approximately 6-24 tests
  - [x] 4.2 Analyze test coverage gaps for THIS feature only
    - Identify critical auth workflows that lack test coverage
    - Focus ONLY on gaps related to this spec's auth requirements
    - Prioritize end-to-end workflows: sign up → sign in → access protected route → sign out
    - Do NOT assess entire application test coverage
- [⚠️] 4.3 Write up to 10 additional strategic tests maximum
    - Add maximum of 10 new tests to fill identified critical gaps
    - Focus on integration points: auth state → navigation → Firestore access
    - Test: unauthenticated user cannot access Firestore (security rules enforced)
    - Test: authenticated user can access Firestore after sign in
    - Test: sign out clears auth state and redirects to sign in
    - Skip edge cases, performance tests, and accessibility tests unless business-critical
  - [x] 4.4 Run feature-specific tests only
    - Run ONLY tests related to this spec's auth feature (tests from 1.1, 2.1, 3.1, and 4.3)
    - Expected total: approximately 16-34 tests maximum
    - Use Firebase Emulator Suite for auth testing (requires emulator setup)
    - Do NOT run the entire application test suite
    - Verify critical auth workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 16-34 tests total)
- Critical auth workflows (sign up, sign in, sign out, password reset) are covered
- Firestore security rules are verified (unauthenticated access denied)
- No more than 10 additional tests added when filling in testing gaps
- Testing focused exclusively on this spec's auth requirements

## Execution Order

Recommended implementation sequence:
1. Auth State Layer (Task Group 1) - Foundation for all auth features
2. Navigation Infrastructure (Task Group 2) - Enables protected routes and screen navigation
3. Auth UI Components (Task Group 3) - User-facing authentication screens
4. Testing & Integration (Task Group 4) - End-to-end verification
