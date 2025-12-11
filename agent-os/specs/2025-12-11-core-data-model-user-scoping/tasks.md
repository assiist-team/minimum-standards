# Task Breakdown: Core data model + user scoping

## Overview
Total Tasks: 4

## Task List

### Database Layer

#### Task Group 1: Firestore model design + shared schemas/converters
**Dependencies:** None

- [ ] 1.0 Complete shared model layer
  - [x] 1.1 Write 2-8 focused tests for shared schemas/converters
    - Focus: Zod schema validation (happy path + 1-2 key invalid cases per model)
    - Focus: timestamp parsing/normalization expectations for Firestore `Timestamp` fields
    - Skip exhaustive field-by-field edge cases
  - [x] 1.2 Define Firestore collection layout under `users/{uid}`
    - Collections: `users/{uid}/activities`, `users/{uid}/standards`, `users/{uid}/activityLogs`
    - Document ID strategy: Firestore auto-IDs
    - Soft delete: include `deletedAt` where applicable
  - [x] 1.3 Define shared Zod schemas for `Activity`, `Standard`, `ActivityLog`
    - Include audit fields: `createdAt`, `updatedAt` (and `editedAt` on logs)
    - Ensure schemas are reusable in both React Native and Cloud Functions contexts
  - [x] 1.4 Add Firestore typed converters aligned to the shared schemas
    - Ensure consistent timestamp handling (Firestore `Timestamp` ↔ app representation)
    - Ensure converter usage is the default for all reads/writes of these models
  - [x] 1.5 Ensure shared model layer tests pass
    - Run ONLY the tests written in 1.1
- [x] 1.0 Complete shared model layer

**Acceptance Criteria:**
- The 2-8 tests written in 1.1 pass
- Shared schemas exist for all three models and enforce required fields
- Converters exist for all three models and consistently handle timestamps
- Collection layout is clearly defined and matches `users/{uid}` scoping

#### Task Group 2: Query patterns + index plan
**Dependencies:** Task Group 1

- [x] 2.0 Complete query + indexing plan
  - [x] 2.1 Write 2-6 focused tests for query helpers (if helpers exist)
    - Focus: query constraints include `where`/`orderBy`/`limit` as intended
    - Skip performance/load testing
  - [x] 2.2 Define initial query patterns needed for MVP and near-term roadmap
    - Activities: list active (not deleted), search by name (if supported)
    - Standards: list active/archived, order by updated/created
    - ActivityLogs: list for a standard (or for current period later), order by timestamp desc
  - [x] 2.3 Add required composite indexes to `firestore.indexes.json`
    - Document which feature depends on each index
  - [x] 2.4 Ensure query helper tests pass
    - Run ONLY the tests written in 2.1
- [x] 2.0 Complete query + indexing plan

**Acceptance Criteria:**
- Query patterns are explicit, narrow, and align with the collection layout
- Required composite indexes are captured in `firestore.indexes.json`
- The 2-6 tests written in 2.1 pass (if query helpers are implemented)

### Security Layer

#### Task Group 3: Firestore security rules for user isolation
**Dependencies:** Task Group 1

- [x] 3.0 Complete Firestore rules for user isolation
  - [x] 3.1 Write 2-8 focused security rules tests (Firebase Emulator)
    - Read/write allowed only for authenticated user matching `{uid}` path
    - Deny cross-user access
    - Deny writes that violate allowed field constraints (as feasible in rules)
  - [x] 3.2 Implement rules for `users/{uid}/activities`, `users/{uid}/standards`, `users/{uid}/activityLogs`
    - Require `request.auth != null`
    - Require `{uid} == request.auth.uid`
    - Ensure normal reads exclude soft-deleted docs via query constraints (and rules mirror constraints when applicable)
  - [x] 3.3 Add any necessary rules helper functions (e.g., allowed keys, timestamp checks)
  - [x] 3.4 Ensure rules tests pass
    - Run ONLY the tests written in 3.1
    - Note: Requires Java installed to run Firebase Firestore emulator locally.
- [x] 3.0 Complete Firestore rules for user isolation

**Acceptance Criteria:**
- The 2-8 rules tests written in 3.1 pass in the Emulator Suite
- Cross-user access is denied
- Authenticated user can read/write only within their own `users/{uid}` scope

### Testing

#### Task Group 4: End-to-end data integrity verification (feature-scope only)
**Dependencies:** Task Groups 1-3

- [x] 4.0 Validate the end-to-end data integrity flow in emulator
  - [x] 4.1 Review tests from Task Groups 1-3
    - Confirm coverage of schema validation + converter behavior
    - Confirm coverage of rules isolation
  - [x] 4.2 Add up to 6 additional integration tests maximum (only if critical gaps exist)
    - Example: create Activity → create Standard → write ActivityLog → read back with converter
    - Example: soft delete behavior (deleted doc is not returned by default query helper)
  - [x] 4.3 Run feature-specific tests only
    - Run ONLY tests from 1.1, 2.1 (if applicable), 3.1, and 4.2 (if added)
    - Note: Rules/integration tests require Java installed (Firestore emulator).
- [x] 4.0 Validate the end-to-end data integrity flow in emulator

**Acceptance Criteria:**
- Feature-specific tests pass (schema/converter + rules + any integration tests)
- The basic create/read flow works against the emulator with converters enabled
- No more than 6 additional tests added in 4.2

## Execution Order

Recommended implementation sequence:
1. Firestore model design + shared schemas/converters (Task Group 1)
2. Query patterns + index plan (Task Group 2)
3. Firestore security rules for user isolation (Task Group 3)
4. End-to-end data integrity verification (Task Group 4)
