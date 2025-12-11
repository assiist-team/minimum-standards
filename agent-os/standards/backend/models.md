## Firestore data modeling best practices

> These conventions assume Firestore is the primary datastore per `profiles/react-firebase/standards/global/tech-stack.md`. If the database changes, update that file first and revisit this document.

- **Collection naming**: Use plural, lowercase collection names (`users`, `projects`). Keep document IDs short, URL-safe, and meaningful when possible.
- **Typed converters**: Define TypeScript interfaces + Firestore data converters so reads/writes stay type-safe and date fields become `Timestamp` or `Date` consistently.
- **Timestamps**: Store `createdAt` and `updatedAt` using `serverTimestamp()` during writes. For client writes, update timestamps inside Cloud Functions to prevent tampering.
- **Reference strategy**: Prefer document references (IDs) over deep nesting. Use subcollections only when the child data is always scoped to a single parent and needs different security rules.
- **Denormalize intentionally**: Duplicate lightweight fields (displayName, photoURL) where it simplifies queries. Document the source-of-truth field to avoid drift.
- **Security rules alignment**: Design schema with security rules in mind (e.g., store `ownerId` on documents so rules can check it quickly).
- **Index planning**: Know which compound queries you need and pre-create the necessary indexes; keep `firestore.indexes.json` up to date.
- **Large lists**: For multi-writer lists, model them as collections instead of array fields to avoid contention and 1MB document limits.
