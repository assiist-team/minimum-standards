Based on your idea for User authentication flows, I have some clarifying questions:

1. **Auth state management**: I'm assuming we'll use Firebase Auth's `onAuthStateChanged` listener to track authentication state, and wrap this in a Zustand store or React context to make it available throughout the app. Should we use Zustand (which aligns with your tech stack) or React Context, and should we wait for auth state to initialize before rendering the main app navigation?

2. **Sign up flow**: For email/password sign up, I'm assuming we'll collect email and password (with password confirmation), validate using React Hook Form + Zod schemas, and show clear error messages using the existing `AuthError` class. Should we also collect any additional user information during sign up (like display name), or keep it minimal for MVP?

3. **Sign in flow**: For email/password sign in, I'm assuming a simple form with email and password fields. For Google OAuth, should we use Firebase's `signInWithCredential` with Google Sign-In, and do you already have Google Sign-In configured in your Firebase project, or should we set that up as part of this spec?

4. **Protected navigation**: I see your app currently uses a simple state-based navigation (`RootView` type). Should we implement route protection by conditionally rendering auth screens vs. main app screens based on auth state, or would you prefer to migrate to React Navigation's native-stack navigator (which you have in your tech stack) with proper navigation guards?

5. **Password reset flow**: I'm assuming we'll have a "Forgot password?" link on the sign-in screen that navigates to a password reset screen where users enter their email, receive a reset link via Firebase Auth's `sendPasswordResetEmail`, and then can reset their password. Should we also handle the reset link deep linking back into the app, or is email-based reset sufficient for MVP?

6. **Sign out**: I'm assuming sign out will be accessible from a settings/profile screen or menu. Should we add a settings screen as part of this spec, or is there an existing place where sign out should live?

7. **Auth state initialization**: To ensure auth state is properly initialized before navigation, I'm assuming we'll show a loading screen or splash screen while checking `auth().currentUser` and waiting for the `onAuthStateChanged` listener to fire. Is that approach acceptable, or do you have a different preference?

8. **Error handling**: I see you already have `AuthError` class with user-friendly messages. Should we use this consistently throughout all auth flows, and should we log auth errors to Crashlytics (as per your error handling standards)?

**Existing Code Reuse:**
Are there existing features in your codebase with similar patterns we should reference? For example:
- Similar form components or input patterns we should reuse
- Comparable screen layouts or navigation patterns
- Related error handling or validation patterns
- Existing auth-related utilities or hooks

Please provide file/folder paths or names of these features if they exist.

**Visual Assets Request:**
Do you have any design mockups, wireframes, or screenshots that could help guide the development?

If yes, please place them in: `agent-os/specs/2025-12-13-user-authentication-flows/planning/visuals/`

Use descriptive file names like:
- sign-in-screen-mockup.png
- sign-up-form-wireframe.jpg
- password-reset-flow.png
- auth-navigation-diagram.png

Please answer the questions above and let me know if you've added any visual files or can point to similar existing features.
