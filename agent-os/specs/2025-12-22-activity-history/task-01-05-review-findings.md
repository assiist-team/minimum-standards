## Activity History Tasks 1–5 · Implementation Issues

1. **ActivityHistory hooks import the wrong Firebase bundle (Tasks 1 & 3)**  
   `useActivityHistory` and `useActivityLogs` reference a non-existent `../config/firebase` module and pull from the web SDK (`firebase/firestore`). The rest of the app—and the new helpers—use `@react-native-firebase/*` via `../firebase/firebaseApp`. As written the screen will not compile, so users cannot open Activity History.

2. **Missing `FirebaseFirestoreTypes` import in `useActivityLogs` (Task 1)**  
   The hook casts snapshot data to `FirebaseFirestoreTypes.Timestamp` without importing that symbol, causing TypeScript to error. The file already mismatches the Firebase bundle, so fixing the import path alone will not resolve this.

3. **Engine never runs the required “on mount” catch-up (Task 2)**  
   The effect intended to run `runCatchUp('boundary')` only depends on `userId`. When the hook mounts, `orderedActiveStandards` is still empty, so the effect returns early and never runs again once standards stream in. No history is generated until a boundary/resume event, violating the spec’s guarantee that period rows exist immediately after sign-in.

4. **Synthetic-row query downloads the entire `activityLogs` collection (Task 1)**  
   `useActivityLogs` subscribes to *every* log document and filters client-side instead of querying `[startMs, nowMs)` per active standard. This scales poorly and contradicts the requirement to mirror dashboard rollups by querying bounded windows.

5. **Duplicate Activity History helper implementations (Task 3)**  
   New shared helpers live in `packages/firestore-model/src/activity-history-helpers.ts`, but the mobile app added another copy under `apps/mobile/src/utils/activityHistoryFirestore.ts` and the engine uses that duplicate. The typed helper deliverable is effectively unused, and the two copies can drift. Wire the app to the shared helper (or remove the duplicate) to satisfy the spec and avoid inconsistencies.

