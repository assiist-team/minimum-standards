# Research: Standards Navigation Overhaul

**Feature**: 001-standards-navigation-overhaul
**Date**: 2026-02-11

## R1: Bottom Sheet Implementation Strategy

**Decision**: Port `BottomSheet.tsx` from ledger_mobile and adapt to minimum_standards theme system.

**Rationale**: The ledger_mobile implementation already matches FR-015 exactly (18px top border radius, 1px border, 42x4px handle bar, 160-180ms animation). Both apps share the `@nine4/ui-kit` design token system, so theme integration is straightforward. The component uses React Native's built-in `Animated` API with `useNativeDriver: true` for performance.

**Alternatives considered**:
- `@gorhom/bottom-sheet`: Powerful gesture-driven library with snap points, but adds a native dependency and is heavier than needed for simple menu/action sheets.
- Build from scratch: Unnecessary duplication — ledger_mobile's component is production-tested and uses the same theme system.

**Source files to port**:
- `/Users/benjaminmackenzie/Dev/ledger_mobile/src/components/BottomSheet.tsx` → base component
- `/Users/benjaminmackenzie/Dev/ledger_mobile/src/components/FormBottomSheet.tsx` → form variant (may be useful for confirmations)

**Adaptation needed**:
- Replace `useUIKitTheme()` with `useTheme()` from `apps/mobile/src/theme/useTheme.ts`
- The minimum_standards `ColorTheme` uses the same token structure (`background.screen`, `border.secondary`, etc.) so mapping is direct.
- The existing `RangeFilterDrawer.tsx` currently uses a custom Modal+Animated approach with 24px border radius and spring animation. After porting, refactor it to wrap the new `BottomSheet` component.

## R2: Create Standard Flow Navigation Architecture

**Decision**: Dedicated React Navigation native stack with 3 screen components, sharing the existing `standardsBuilderStore` (Zustand) for cross-step state.

**Rationale**: React Navigation's native stack provides native back-swipe gestures, native transition animations, and works naturally within the existing tab navigator hierarchy. The `standardsBuilderStore` already manages all form fields needed across steps (selectedActivity, cadence, goalTotal, sessionConfig, periodStartPreference).

**Alternatives considered**:
- Single screen with internal step state: Simpler navigation graph but requires custom transition animations and loses native back gestures.
- Modal stack navigator: Gives "temporary flow" feel but adds complexity for a flow that's now a primary navigation target (the "+" tab).

**Implementation approach**:
- The "+" tab in the bottom nav won't be a traditional tab — it will intercept the tab press and navigate into a `CreateStandardStack` presented modally or as a stack push.
- `CreateStandardStack` contains 3 screens: `SelectActivity` → `SetVolume` → `SetPeriod`.
- The `standardsBuilderStore` is `reset()` when the flow is entered and read from across steps.
- On completion, the store's `generatePayload()` is called and the flow pops back to the Standards tab.
- For Edit mode: the store is pre-populated via `standardsBuilderStore.loadFromStandard(standard)` before navigating into the stack.

**Step breakdown**:
| Step | Screen | Store Fields Used |
|------|--------|-------------------|
| 1: Select Activity | `SelectActivityScreen` | selectedActivity, (category assignment via useCategories) |
| 2: Set Volume | `SetVolumeScreen` | goalTotal, unitOverride, breakdownEnabled, sessionLabel, sessionsPerCadence, volumePerSession |
| 3: Set Period | `SetPeriodScreen` | cadence, periodStartPreference |

## R3: Preference Persistence for Show/Hide Toggles

**Decision**: Extend existing `uiPreferencesStore` (Zustand + AsyncStorage persist) with `showTimeBar` and `showInactiveStandards` boolean fields.

**Rationale**: The store already persists `preferredActivityChart` and `themePreference` via Zustand's `persist` middleware with AsyncStorage. Adding two boolean fields is trivial and consistent with the existing pattern. Local persistence is ideal for device-specific UI preferences that don't need cross-device sync.

**Alternatives considered**:
- Firestore user preferences: Adds network dependency for simple UI toggles. Overkill for a per-device preference.

**Implementation**:
```typescript
// Added to uiPreferencesStore state:
showTimeBar: boolean;         // default: true
showInactiveStandards: boolean; // default: false
```

## R4: Standards Library Relocation to Settings

**Decision**: Move the `StandardsLibraryScreen` into the Settings stack. Add a "Manage Standards" menu option on the main Standards screen that cross-navigates to Settings > Standards.

**Rationale**: The user wants Settings to become the entity management hub (Categories, Activities, Standards). The Library screen remains useful for bulk management but doesn't need its own tab. The main Standards screen handles day-to-day active standard viewing with an optional inline inactive standards toggle.

**Implementation approach**:
- The `SettingsStack` navigator gains a new `Standards` route pointing to `StandardsLibraryScreen`.
- `SettingsScreen.tsx` gains a new "Standards" row in its menu (alongside existing Categories, Activities, Snapshots, etc.).
- The main Standards screen's kebab menu includes "Manage Standards" which cross-navigates: `navigation.navigate('Settings', { screen: 'Standards' })`.
- The `StandardsLibraryScreen` may need its navigation header adapted (currently uses a custom `onBack` prop) to work within React Navigation's stack header.

## R5: Alert.alert Migration Inventory

**Decision**: Replace all `Alert.alert()` calls with bottom sheet confirmations/notifications.

**Current usage inventory** (5 files, ~8 call sites):

| File | Context | Replacement |
|------|---------|-------------|
| `StandardsLibraryScreen.tsx` | Delete confirmation | Confirmation bottom sheet with destructive styling |
| `StandardsLibraryScreen.tsx` | Delete error | Error bottom sheet or inline ErrorBanner |
| `ActivityLibraryScreen.tsx` | Delete confirmation | Confirmation bottom sheet |
| `ActivityLibraryScreen.tsx` | Delete/restore errors | Error bottom sheet or inline ErrorBanner |
| `StandardsBuilderScreen.tsx` | Success on create | Success bottom sheet or toast |
| `StandardsBuilderScreen.tsx` | Success on update | Success bottom sheet or toast |
| `StandardsBuilderScreen.tsx` | Existing standard activated | Info bottom sheet |
| `ActiveStandardsDashboardScreen.tsx` | Deactivate error | Error bottom sheet or inline ErrorBanner |
| `LogEntryModal.tsx` | Success (iOS only — Android uses Toast) | Success bottom sheet or toast |

**Strategy**:
- Destructive confirmations → `ConfirmationBottomSheet` (two-action: Cancel + destructive action)
- Error alerts → Keep inline `ErrorBanner` where it already exists; use bottom sheet for one-off errors
- Success alerts → Brief auto-dismissing toast or bottom sheet; consider keeping Android `ToastAndroid` pattern

## R6: Category–Activity Relationship

**Research finding**: The `Activity` type in `@minimum-standards/shared-model` does **not** currently include a `categoryId` field. However, the spec requires showing category info on activity selection (FR-019, FR-020).

**Evidence**:
- `types.ts` Activity shape: `{ id, name, unit, notes, createdAtMs, updatedAtMs, deletedAtMs }` — no categoryId.
- Comment in `useStandards.ts` → `CreateStandardInput`: `// categoryId is legacy - categories belong to Activities`.
- A `useCategories()` hook exists, and Settings has a Categories screen.

**Decision**: The category–activity relationship likely exists in Firestore but may not be reflected in the shared-model types yet. During implementation, verify:
1. Whether Activity documents in Firestore have a `categoryId` field
2. Whether the `useCategories()` hook provides a mapping from activityId → category
3. If the shared-model `Activity` type needs a `categoryId` field added

This is a data model gap that the implementation WPs should resolve in their first task.

## R7: Scorecard Tab Icon

**Decision**: Use `analytics` MaterialIcons icon for the Scorecard tab.

**Rationale**: The bar chart metaphor conveys data/scoring effectively. It's visually distinct from `pending-actions` (Standards tab) and `settings` (Settings tab). The current `task-alt` icon (checkmark in circle) doesn't communicate "scorecard" well.
