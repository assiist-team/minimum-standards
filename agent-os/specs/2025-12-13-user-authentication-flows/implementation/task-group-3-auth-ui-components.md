# Task Group 3 – Auth UI Components

## Scope
- SignInScreen component with email/password form and Google Sign-In button
- SignUpScreen component with email, password, and password confirmation fields
- PasswordResetScreen component with email input
- SettingsScreen component with sign-out functionality
- Zod schemas for form validation (`apps/mobile/src/schemas/authSchemas.ts`)
- Error handling using `AuthError` class consistently across all screens
- Crashlytics logging for auth errors

## Implementation Notes
- All forms use React Hook Form with Zod resolver for validation
- SignInScreen supports both email/password and Google OAuth sign-in
- Google Sign-In configured with `react-native-config` for web client ID
- SignUpScreen validates password match and minimum length (6 characters)
- PasswordResetScreen shows success message after email sent
- SettingsScreen calls Firebase `signOut()` and clears auth store
- All screens use `AuthError.fromFirebaseError()` for consistent error handling
- Crashlytics logging implemented via `logAuthErrorToCrashlytics()` utility
- Navigation handled automatically by AppNavigator auth guard (no manual navigation after successful auth)

## Verification
- `npm --prefix apps/mobile run lint` (passes)
- `npm --prefix apps/mobile run typecheck` (passes)
- `npm --prefix apps/mobile test src/screens/__tests__/SignInScreen.test.tsx` (passes)
- `npm --prefix apps/mobile test src/screens/__tests__/SignUpScreen.test.tsx` (passes)
- `npm --prefix apps/mobile test src/screens/__tests__/PasswordResetScreen.test.tsx` (passes)
- `npm --prefix apps/mobile test src/screens/__tests__/SettingsScreen.test.tsx` (passes)

## Risks & Follow-ups
- Google Sign-In requires `GOOGLE_SIGN_IN_WEB_CLIENT_ID` environment variable (configured in `.env` file)
- iOS requires `pod install` after adding `react-native-config` dependency
- Pod dependency conflict exists: Firebase requires `GTMSessionFetcher/Core` 5.x while `@react-native-google-signin/google-signin@13.3.1` requires ~>3.3 (needs resolution before iOS build)
