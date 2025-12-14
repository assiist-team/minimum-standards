## Tech stack

This product uses the **default tech stack** defined in `agent-os/standards/global/tech-stack.md` (React Native + Firebase).

> Note: This file is a project-level summary. For any details not captured here, use `agent-os/standards/global/tech-stack.md` as the source of truth.

### Framework & Runtime
- **Application Framework:** React Native CLI (TypeScript template)
- **Language/Runtime:** TypeScript targeting React Native JavaScriptCore/Hermes and Node.js 20 for Cloud Functions
- **Package Manager:** npm with workspaces for app + functions

### Frontend (Mobile)
- **UI Framework:** React Native with React Navigation (native-stack + bottom tabs)
- **State Management:** Zustand for local state, TanStack Query for server/cache state
- **Forms & Validation:** React Hook Form + Zod schemas shared with backend
- **Styling:** NativeWind utility classes plus `StyleSheet`-backed theme tokens
- **Device Support:** iOS 15+ and Android API 24+, with `react-native-safe-area-context` and `react-native-screens`

### Database & Storage
- **Database:** Firebase Cloud Firestore (modular v10 SDK)
- **Data Modeling:** Typed converters + Zod validation, subcollections only when necessary
- **Caching:** React Query caching + Firestore offline persistence
- **Storage:** Firebase Storage with folder-based ACLs

### Backend & Serverless
- **Serverless Platform:** Cloud Functions for Firebase (Node.js 20, v2 API)
- **HTTP Framework:** Express-style routers hosted inside HTTPS functions
- **Background Jobs:** Scheduled Cloud Functions + Firestore triggers
- **Messaging/Notifications:** Firebase Cloud Messaging via `@react-native-firebase/messaging`

### Testing & Quality
- **Test Framework:** Jest + React Native Testing Library; Detox for device flows; Jest + `firebase-functions-test` for Cloud Functions
- **Linting/Formatting:** ESLint (React Native community config), Prettier, TypeScript strict mode
- **Local Environment:** Firebase Emulator Suite for Auth, Firestore, Storage, and Functions

### Deployment & Infrastructure
- **Mobile Distribution:** Fastlane-driven iOS TestFlight and Google Play Internal Testing
- **Backend Deployment:** Firebase CLI via GitHub Actions, environment aliases (dev/stage/prod)
- **CI/CD:** GitHub Actions (lint, tests, Detox, build, deploy)

### Third-Party Services
- **Authentication:** Firebase Auth (email/password + OAuth providers)
- **Feature flags:** Firebase Remote Config for gradual rollouts and experiments
- **Crash & Performance:** Firebase Crashlytics and Performance Monitoring
- **Analytics:** Firebase Analytics with BigQuery export
- **Monitoring:** Optional Sentry for React Native + Functions where deeper traces are required
