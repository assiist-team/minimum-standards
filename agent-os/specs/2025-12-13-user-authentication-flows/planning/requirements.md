# Spec Requirements: User authentication flows

## Initial Description
User authentication flows — Implement complete authentication system: auth state management with Firebase Auth persistence, sign up (email/password), sign in (email/password + Google OAuth), protected navigation/routes that redirect unauthenticated users to auth screens, sign out functionality, and password reset flow. Ensure auth state is properly initialized before app navigation and all Firestore security rules are enforced.

## Requirements Discussion

### First Round Questions

**Q1:** Auth state management: I'm assuming we'll use Firebase Auth's `onAuthStateChanged` listener to track authentication state, and wrap this in a Zustand store or React context to make it available throughout the app. Should we use Zustand (which aligns with your tech stack) or React Context, and should we wait for auth state to initialize before rendering the main app navigation?
**Answer:** User doesn't understand the difference between Zustand and React Context. Recommendation: Use Zustand (already in tech stack and codebase, simpler than Context, avoids unnecessary re-renders).

**Q2:** Sign up flow: For email/password sign up, I'm assuming we'll collect email and password (with password confirmation), validate using React Hook Form + Zod schemas, and show clear error messages using the existing `AuthError` class. Should we also collect any additional user information during sign up (like display name), or keep it minimal for MVP?
**Answer:** No additional user information - keep it minimal for MVP.

**Q3:** Sign in flow: For email/password sign in, I'm assuming a simple form with email and password fields. For Google OAuth, should we use Firebase's `signInWithCredential` with Google Sign-In, and do you already have Google Sign-In configured in your Firebase project, or should we set that up as part of this spec?
**Answer:** Use Firebase's Google Sign-In, and Google Sign-In is already configured in the Firebase project.

**Q4:** Protected navigation: I see your app currently uses a simple state-based navigation (`RootView` type). Should we implement route protection by conditionally rendering auth screens vs. main app screens based on auth state, or would you prefer to migrate to React Navigation's native-stack navigator (which you have in your tech stack) with proper navigation guards?
**Answer:** Current navigation is bad and not what was intended. Prefer to migrate to React Navigation's native-stack navigator with proper navigation guards.

**Q5:** Password reset flow: I'm assuming we'll have a "Forgot password?" link on the sign-in screen that navigates to a password reset screen where users enter their email, receive a reset link via Firebase Auth's `sendPasswordResetEmail`, and then can reset their password. Should we also handle the reset link deep linking back into the app, or is email-based reset sufficient for MVP?
**Answer:** User doesn't have email provider attached in Firebase Console. Need to clarify: enable email provider and include password reset in this spec, or skip password reset for MVP?

**Q6:** Sign out: I'm assuming sign out will be accessible from a settings/profile screen or menu. Should we add a settings screen as part of this spec, or is there an existing place where sign out should live?
**Answer:** Add a settings page with sign out functionality as part of this spec.

**Q7:** Auth state initialization: To ensure auth state is properly initialized before navigation, I'm assuming we'll show a loading screen or splash screen while checking `auth().currentUser` and waiting for the `onAuthStateChanged` listener to fire. Is that approach acceptable, or do you have a different preference?
**Answer:** Loading screen approach is acceptable.

**Q8:** Error handling: I see you already have `AuthError` class with user-friendly messages. Should we use this consistently throughout all auth flows, and should we log auth errors to Crashlytics (as per your error handling standards)?
**Answer:** (Not explicitly answered, but can infer from context - will use existing AuthError class consistently)

### Existing Code to Reference

No similar existing features identified for reference.

### Follow-up Questions

**Follow-up 1:** Password reset / Email provider: Firebase Auth's `sendPasswordResetEmail` requires email to be enabled in Firebase Console (Authentication → Sign-in method → Email/Password). Do you want to enable email provider and include password reset in this spec, or skip password reset for MVP and add it later?
**Answer:** Email/password provider is already enabled in Firebase Console. Include password reset flow in this spec.

## Visual Assets

No visual assets provided.

## Requirements Summary

### Functional Requirements
- Auth state management using Zustand store with Firebase Auth's `onAuthStateChanged` listener
- Wait for auth state initialization before rendering main app navigation (show loading screen)
- Sign up flow: Email/password with password confirmation, React Hook Form + Zod validation, minimal MVP (no additional user info)
- Sign in flow: Email/password form + Google OAuth (already configured in Firebase)
- Migrate from current state-based navigation to React Navigation's native-stack navigator
- Protected navigation/routes that redirect unauthenticated users to auth screens
- Sign out functionality accessible from a new settings screen
- Password reset flow: "Forgot password?" link on sign-in screen → password reset screen → user enters email → Firebase sends reset email → email-based reset (no deep linking required for MVP)
- Consistent error handling using existing `AuthError` class
- Log auth errors to Crashlytics per error handling standards
- Ensure all Firestore security rules are enforced (rules already require authentication)

### Reusability Opportunities
- Use existing `AuthError` class from `apps/mobile/src/utils/errors.ts` for consistent error handling
- Follow Zustand store pattern from `apps/mobile/src/stores/standardsBuilderStore.ts` for auth state management
- Use React Hook Form + Zod validation patterns already established in codebase
- Follow existing form component patterns and styling conventions

### Scope Boundaries
**In Scope:**
- Auth state management with Zustand
- Sign up (email/password, minimal MVP)
- Sign in (email/password + Google OAuth)
- Migration to React Navigation native-stack navigator
- Protected navigation/routes
- Settings screen with sign out
- Loading screen for auth state initialization
- Password reset flow (email provider already enabled)

**Out of Scope:**
- Additional user profile information collection during sign up
- Deep linking for password reset (email-based reset sufficient for MVP, if included)
- Other OAuth providers beyond Google
- Email verification flow (not mentioned in requirements)

### Technical Considerations
- Firebase Auth persistence is handled automatically by Firebase SDK
- Google Sign-In already configured in Firebase project
- Firestore security rules already enforce authentication (`isSignedIn()` and `isOwner(uid)`)
- Use existing error handling patterns (`AuthError` class)
- Follow existing Zustand store patterns for state management
- Use React Hook Form + Zod for form validation
- Migrate navigation to React Navigation's native-stack navigator
- Email/password provider already enabled in Firebase Console
