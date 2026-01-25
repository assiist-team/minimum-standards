# Troubleshooting: Firestore Permission Denied during Activity Migration

## Issue Description
The application encounters a `[firestore/permission-denied]` error when running the activity category migration on a fresh install. The migration attempts to update existing Activity documents to populate the `categoryId` field based on legacy Standards data.

**Error Log:**
```
[Migration] Failed:', [Error: [firestore/permission-denied] The caller does not have permission to execute the specified operation.]
Write at users/{userId}/activities/{activityId} failed: Missing or insufficient permissions.
```

## Root Cause Analysis
The error indicates that the Firestore security rules are rejecting the `update` operation on the `activities` collection.

The relevant rule is `validActivityUpdate` in `firestore.rules`:

```javascript
function validActivityUpdate() {
  let affected = request.resource.data.diff(resource.data).affectedKeys();
  return affected.hasOnly([
    'name',
    'unit',
    'notes',
    'categoryId', // <--- This is allowed
    'updatedAt',
    'deletedAt'
  ])
  && (
    // ... checks for other fields ...
  )
  && (
    !affected.hasAny(['categoryId']) || (
      !('categoryId' in request.resource.data)
      || request.resource.data.categoryId == null
      || (request.resource.data.categoryId is string && request.resource.data.categoryId.size() >= 1)
    )
  )
  // ...
}
```

The migration code sends an update with `{ categoryId: "someId", updatedAt: serverTimestamp() }`.

### Potential Causes

1.  **Implicit Fields in Update:** The `toFirestoreActivityUpdate` function might be including `undefined` values for other fields (like `notes` or `unit`) if the `updates` object passed to it contains them as `undefined`. However, the current implementation checks `!== undefined`, so this is unlikely unless `updates` contains other keys.
2.  **`createdAt` Check Failure:** The rule `isUpdateWithServerTimestampAndStableCreatedAt` ensures `createdAt` is not changed.
    ```javascript
    function isUpdateWithServerTimestampAndStableCreatedAt() {
      return request.resource.data.updatedAt == request.time &&
        request.resource.data.get('createdAt', null) == resource.data.get('createdAt', null);
    }
    ```
    If the existing document is missing `createdAt`, both sides return `null`, which is equal. If it exists, it must be preserved. The update does not send `createdAt`, so it should be preserved.
3.  **Invalid `categoryId`:** The rule requires `categoryId` to be a string with length >= 1. The migration code filters out empty strings, so this should be fine.
4.  **Affected Keys Behavior:** If the `categoryId` field is being *added* (it didn't exist before), it appears in `affectedKeys`. The `hasOnly` check allows it.

## Debugging Steps

To isolate the issue, follow these steps:

### 1. Verify Firestore Rules
Check if the deployed rules match the local `firestore.rules`. The `validActivityUpdate` function must include `'categoryId'` in the `hasOnly` list.

### 2. Check for "Ghost" Fields
If the `Activity` object in the app has fields that are not in the schema (e.g. from an old version), and we pass them to `updateActivity`, they might be stripped by `toFirestoreActivityUpdate` but it's worth verifying.

### 3. Test with Minimal Update
Try to manually update a document using the Firebase Console or a temporary script to see if *any* update works.
```javascript
// Test script
await firestore().collection('users').doc(uid).collection('activities').doc(activityId).update({
  categoryId: 'test-category',
  updatedAt: firestore.FieldValue.serverTimestamp()
});
```

### 4. Verify Auth
Ensure the user ID in the path matches the authenticated user's ID. The logs suggest this is correct (`VfMVQ3rRm6TNDT9rNtNWDhZ9ui93`).

## Recommended Fixes

### A. Relax Rule for Debugging
Temporarily allow all updates to `categoryId` to verify if the specific validation logic is the problem.

Change:
```javascript
    !affected.hasAny(['categoryId']) || (
      !('categoryId' in request.resource.data)
      || request.resource.data.categoryId == null
      || (request.resource.data.categoryId is string && request.resource.data.categoryId.size() >= 1)
    )
```
To:
```javascript
    !affected.hasAny(['categoryId']) || true
```

### B. Ensure `categoryId` is Valid
In `CategorySettingsScreen.tsx`, ensure we are not sending a string that might be considered empty by Firestore (though `size() >= 1` should handle it).

### C. Check `toFirestoreActivityUpdate`
Ensure it strictly only returns allowed keys.

```typescript
export function toFirestoreActivityUpdate(updates: Partial<...>) {
  const result: any = {
    updatedAt: serverTimestamp(),
  };
  // ...
  if (updates.categoryId !== undefined) {
    result.categoryId = updates.categoryId ?? null;
  }
  // Ensure no other keys are added
  return result;
}
```

## Resolution Plan

1.  **Review `firestore.rules`** to ensure `categoryId` is correctly permitted in `validActivityUpdate`.
2.  **Deploy Rules:** If you changed the rules locally, make sure they are deployed to Firebase.
3.  **Restart App:** After deploying rules, restart the app to retry the migration.
