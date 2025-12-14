# Spec Initialization: User authentication flows

## Raw idea (verbatim)

User authentication flows — Implement complete authentication system: auth state management with Firebase Auth persistence, sign up (email/password), sign in (email/password + Google OAuth), protected navigation/routes that redirect unauthenticated users to auth screens, sign out functionality, and password reset flow. Ensure auth state is properly initialized before app navigation and all Firestore security rules are enforced.
