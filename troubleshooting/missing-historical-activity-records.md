# Missing Historical Activity Records

## Summary
Activity History shows only the current period but no historical periods. The activity history engine is not creating `activityHistory` documents for completed periods.

**Symptoms:**
- Current period displays correctly (synthetic data from logs)
- No historical periods visible in Activity History screens
- No `activityHistory` documents exist in Firestore for any activities

## Root Cause Analysis

### Primary Cause: Activity History Engine Not Running
The activity history engine (`useActivityHistoryEngine`) is responsible for creating historical documents when periods complete. If it's not running or failing, no historical documents are created.

### Secondary Causes

#### 1. Stale Bundle Issues
The app may be running an old JS bundle that contains broken activity history engine code.

**Evidence:** Error logs containing "stale bundle", "invalid parameter", or Firestore binding errors.

#### 2. Period Boundary Calculation Errors
If period calculations are inconsistent between the engine and dashboard, the engine may not detect completed periods correctly.

**Evidence:** Periods complete in dashboard but engine doesn't create documents.

#### 3. Firestore Write Failures
The engine runs but fails to write documents due to permissions, validation, or connectivity issues.

**Evidence:** Engine logs successful catch-up runs but no documents appear.

#### 4. Period Start Preference Changes
If `periodStartPreference` was changed after periods completed, historical documents won't be created retroactively.

**Evidence:** Historical periods existed before preference changes, disappeared after.

## Diagnosis Steps

### 1. Check Engine Mount Status
Verify the activity history engine is mounted in the app:

```typescript
// apps/mobile/src/navigation/BottomTabNavigator.tsx
useActivityHistoryEngine(); // Should be called
```

### 2. Check Console Logs
Look for activity history engine logs:
- `[useActivityHistoryEngine] Catch-up already running, skipping`
- `[useActivityHistoryEngine] STALE BUNDLE DETECTED`
- `[useActivityHistoryEngine] Error during catch-up`

If no logs appear when periods should complete, the engine isn't running.

### 3. Verify Period Calculations
Check that all period calculations use consistent `periodStartPreference`:

- ✅ `apps/mobile/src/utils/dashboardProgress.ts`
- ✅ `apps/mobile/src/hooks/useActivityHistoryEngine.ts`
- ✅ `apps/mobile/src/screens/StandardDetailScreen.tsx`
- ❌ `apps/mobile/src/hooks/useActivityLogs.ts` (FIXED)

### 4. Check Firestore Documents
Query for activity history documents:

```javascript
// In Firebase Console or admin SDK
db.collection('users/{userId}/activityHistory').get()
```

If documents exist but aren't displayed, the issue is in fetching/display logic.

### 5. Test Engine Triggering
Force trigger the activity history engine by:
1. Complete a period (log enough activity to meet the goal)
2. Wait for dashboard to refresh
3. Check if historical document is created

## Resolution Steps

### Step 1: Fix Bundle Issues (Most Common)
If you see stale bundle errors:

1. **Rebuild firestore-model package:**
   ```bash
   cd packages/firestore-model
   npm run build
   ```

2. **Reinstall mobile dependencies:**
   ```bash
   cd apps/mobile
   npm install
   ```

3. **Clean Metro cache:**
   ```bash
   npx react-native start --reset-cache
   ```

4. **Regenerate embedded bundle:**
   ```bash
   npx react-native bundle \
     --platform ios \
     --dev false \
     --entry-file index.js \
     --bundle-output ios/main.jsbundle \
     --assets-dest ios \
     --reset-cache
   ```

5. **Clean Xcode and rebuild:**
   - Product → Clean Build Folder
   - Delete DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData/MinimumStandardsMobile-*`
   - Product → Build & Run

### Step 2: Verify Engine Execution
1. Open app and check console for engine logs
2. Complete a period and watch for catch-up logs
3. If no logs appear, check if engine is imported/mounted

### Step 3: Check Period Consistency
Ensure all `calculatePeriodWindow` calls pass `periodStartPreference`:

```typescript
calculatePeriodWindow(timestamp, cadence, timezone, {
  periodStartPreference: standard.periodStartPreference,
});
```

### Step 4: Test Document Creation
1. Create a test standard with a short cadence (daily)
2. Log activity to complete the period
3. Verify document appears in Firestore
4. Verify document appears in Activity History UI

## Prevention

### Code Changes
- All period calculations must use `periodStartPreference`
- Runtime validation should catch stale bundle issues early
- Engine should log all operations for debugging

### Testing
- Test period completion creates historical documents
- Test preference changes don't break historical data
- Test bundle rebuilding preserves functionality

## Related Issues
- `troubleshooting/activity-history-engine-call-error.md`
- `troubleshooting/metro-debug-builds-stuck-on-embedded-bundle.md`

## Implementation Notes
- Activity history engine only creates documents going forward
- Historical documents store the `periodStartPreference` used to calculate them
- No automatic backfill of missing historical data
- Engine runs at app root via `useActivityHistoryEngine()` hook