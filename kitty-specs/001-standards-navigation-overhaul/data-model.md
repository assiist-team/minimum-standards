# Data Model: Standards Navigation Overhaul

**Feature**: 001-standards-navigation-overhaul
**Date**: 2026-02-11

## Existing Entities (No Schema Changes)

### Standard

**Collection**: `/users/{userId}/standards/{standardId}`

| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| activityId | string | Reference to Activity |
| minimum | number | Target volume per period (sessionsPerCadence × volumePerSession) |
| unit | string | Normalized to plural form (e.g., "minutes") |
| cadence | StandardCadence | `{ interval: number, unit: 'day' \| 'week' \| 'month' }` |
| sessionConfig | StandardSessionConfig | `{ sessionLabel, sessionsPerCadence, volumePerSession }` |
| state | 'active' \| 'archived' | Current lifecycle state |
| archivedAtMs | number \| null | Timestamp when deactivated |
| summary | string | Human-readable summary (e.g., "30 minutes / week") |
| quickAddValues | number[] \| undefined | Preset chips for fast logging |
| periodStartPreference | PeriodStartPreference \| undefined | `{ mode: 'default' }` or `{ mode: 'weekDay', weekStartDay: 1-7 }` |
| createdAtMs | number | Creation timestamp |
| updatedAtMs | number | Last update timestamp |
| deletedAtMs | number \| null | Soft delete timestamp |

**State transitions relevant to this feature**:
- `active` → `archived`: User taps "Deactivate" in card action menu → sets `state: 'archived'`, `archivedAtMs: now()`
- `archived` → `active`: User taps "Reactivate" in inactive standard action menu → sets `state: 'active'`, `archivedAtMs: null`, progress reset for current period

### Activity

**Collection**: `/users/{userId}/activities/{activityId}`

| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| name | string | Display name |
| unit | string | Unit of measurement (plural) |
| notes | string \| null | Optional notes |
| createdAtMs | number | Creation timestamp |
| updatedAtMs | number | Last update timestamp |
| deletedAtMs | number \| null | Soft delete timestamp |

**Gap identified**: The shared-model `Activity` type does not include `categoryId`. However, FR-019 and FR-020 require displaying and assigning categories on activities. The `useCategories()` hook exists and a Categories settings screen is present. Implementation must verify whether:
1. Firestore Activity documents already store a `categoryId` field not reflected in the TypeScript type
2. Or categories are tracked separately (e.g., a join collection)

If `categoryId` is stored on the Activity document, the `Activity` type in `packages/shared-model/src/types.ts` should be extended:

```typescript
type Activity = {
  id: string;
  name: string;
  unit: string;
  categoryId: string | null;  // ← ADD: reference to Category
  notes: string | null;
  createdAtMs: TimestampMs;
  updatedAtMs: TimestampMs;
  deletedAtMs: TimestampMs | null;
};
```

### Category

**Collection**: `/users/{userId}/categories/{categoryId}` (assumed)

| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| name | string | Display name (e.g., "Fitness", "Work") |
| displayOrder | number \| undefined | Sort order |

*Note: Exact schema needs verification from `useCategories()` hook and Firestore rules.*

### ActivityLog

**Collection**: `/users/{userId}/activityLogs/{logId}`

No changes needed for this feature. Logging is not affected by navigation restructure.

## New State: UI Preferences

### uiPreferencesStore Extensions

**Storage**: AsyncStorage (key: `ui-preferences-storage`)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| showTimeBar | boolean | true | FR-008: Whether progress/time bars are visible on standard cards |
| showInactiveStandards | boolean | false | FR-009: Whether archived standards are shown on the Standards screen |

These are **additions** to the existing persisted store which already contains:
- `preferredActivityChart: ChartType`
- `themePreference: ThemePreference`

## Component State: standardsBuilderStore

**No structural changes** to the store shape. The same fields support the 3-step flow:

| Step | Fields Read | Fields Written |
|------|------------|----------------|
| Step 1: Select Activity | selectedActivity | selectedActivity (+ category via useCategories) |
| Step 2: Set Volume | selectedActivity.unit, goalTotal, breakdownEnabled, sessionLabel, sessionsPerCadence, volumePerSession | goalTotal, unitOverride, breakdownEnabled, sessionLabel, sessionsPerCadence, volumePerSession |
| Step 3: Set Period | cadence, periodStartPreference | cadence, periodStartPreference |

**New methods needed**:
- `reset()`: Clear all fields to defaults when entering the Create flow
- `loadFromStandard(standard: Standard, activity: Activity)`: Pre-populate all fields for Edit mode

## Navigation State

### Bottom Tab Configuration

```typescript
type BottomTabParamList = {
  Standards: undefined;
  Scorecard: undefined;
  Settings: { screen?: 'Standards' | 'Categories' | 'Activities' | 'SettingsRoot' };
  Create: undefined;  // Intercepted — never actually rendered
};
```

### Standards Stack

```typescript
type StandardsStackParamList = {
  StandardsScreen: undefined;
  StandardDetail: { standardId: string };
  StandardPeriodActivityLogs: { standardId: string };
};
```

### Create Standard Stack (Modal)

```typescript
type CreateStandardStackParamList = {
  SelectActivity: { editStandardId?: string };  // Optional for edit mode
  SetVolume: undefined;
  SetPeriod: undefined;
};
```

### Settings Stack (Extended)

```typescript
type SettingsStackParamList = {
  SettingsRoot: undefined;
  Standards: undefined;    // ← NEW: relocated StandardsLibraryScreen
  Categories: undefined;
  Activities: undefined;
  Snapshots: undefined;
  SnapshotCreate: undefined;
  SnapshotDetail: { snapshotId: string };
  SnapshotEdit: { snapshotId: string };
};
```

## Bottom Sheet Action Menus

### Active Standard Card Actions (FR: US5)

```typescript
type ActiveStandardActions = {
  items: [
    { label: 'Edit'; icon: 'edit'; action: 'navigate-to-create-flow-edit' },
    { label: 'Deactivate'; icon: 'archive'; action: 'archive-standard'; destructive: false },
    { label: 'Delete'; icon: 'delete'; action: 'confirm-delete'; destructive: true },
    { label: 'Categorize'; icon: 'label'; action: 'assign-category' },
  ];
};
```

### Inactive Standard Card Actions (FR: US1)

```typescript
type InactiveStandardActions = {
  items: [
    { label: 'Reactivate'; icon: 'toggle-on'; action: 'unarchive-standard' },
    { label: 'Delete'; icon: 'delete'; action: 'confirm-delete'; destructive: true },
    { label: 'View Logs'; icon: 'history'; action: 'navigate-to-logs' },
  ];
};
```

### Standards Screen Kebab Menu

```typescript
type StandardsScreenMenu = {
  items: [
    { label: 'Show Time Bar'; type: 'toggle'; value: showTimeBar },
    { label: 'Show Inactive Standards'; type: 'toggle'; value: showInactiveStandards },
    { label: 'Manage Standards'; icon: 'list'; action: 'navigate-to-settings-standards' },
  ];
};
```
