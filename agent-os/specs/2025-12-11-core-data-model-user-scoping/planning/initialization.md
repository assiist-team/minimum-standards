# Spec Initialization: Core data model + user scoping

## Raw idea (verbatim)

Core data model + user scoping — Define Firestore collections and shared Zod schemas/converters for `Activity`, `Standard`, and `ActivityLog`, scoped per user via Firebase Auth and security rules, so all reads/writes are validated and isolated.
