# Implementation Plan: Standards Navigation Overhaul

**Branch**: `001-standards-navigation-overhaul` | **Date**: 2026-02-11 | **Spec**: [spec.md](kitty-specs/001-standards-navigation-overhaul/spec.md)
**Input**: Feature specification from `/kitty-specs/001-standards-navigation-overhaul/spec.md`

## Summary

Overhaul the app's navigation and screen architecture: merge the Active and Library tabs into a unified **Standards** screen, relocate the Standards Library to **Settings** as a management screen, restructure bottom navigation to 4 items (Standards | Scorecard | Settings | +), revamp Create Standard into a 3-step survey-style flow, and convert all `Alert.alert()` dialogs and custom overlay menus to bottom sheets ported from ledger_mobile.

## Technical Context

**Language/Version**: TypeScript 5.x (React Native 0.76+, Expo)
**Primary Dependencies**: React Navigation v6 (native stack + bottom tabs), Zustand (state), Firebase/Firestore (backend), react-native-vector-icons/MaterialIcons, react-native-safe-area-context
**Storage**: Firestore (domain data, per-user collections), AsyncStorage via Zustand persist (UI preferences)
**Testing**: Manual testing (no automated test framework currently in place)
**Target Platform**: iOS + Android (React Native)
**Project Type**: Mobile (monorepo with `apps/mobile`, `packages/shared-model`, `packages/firestore-model`, `packages/ui-kit`)
**Performance Goals**: 60fps animations on bottom sheets, <100ms navigation transitions
**Constraints**: Offline-capable reads (Firestore persistence), must respect safe area insets on all devices
**Scale/Scope**: Single-user app, ~15 screens, ~10 components affected by this feature

## Constitution Check

*No constitution file found — section skipped.*

## Engineering Alignment

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Bottom Sheet implementation | Port from ledger_mobile | Already matches FR-015 spec exactly; same theme system |
| 2 | Create Standard flow navigation | React Navigation native stack (3 screens) | Native back gestures, fits existing navigator hierarchy |
| 3 | Preference persistence | Extend `uiPreferencesStore` (Zustand + AsyncStorage) | Consistent with existing pattern; fast, offline, device-specific |
| 4 | Scorecard tab icon | `analytics` MaterialIcons | Visually distinct, conveys data/scoring |
| 5 | Standards Library | Relocate to Settings stack (not deleted) | Settings becomes entity management hub; Library accessible from Settings + "Manage Standards" menu |

## Architecture: Current → New

### Current Navigation

```
BottomTabNavigator (TabBarWithStickyLogButton)
├── Dashboard tab (icon: star, label: "Active")
│   └── DashboardStack
│       ├── ActiveStandardsDashboard (initial)
│       ├── StandardsBuilder
│       └── StandardDetail
├── Standards tab (icon: pending-actions, label: "Standards")
│   └── StandardsStack
│       ├── StandardsLibrary (initial)
│       ├── StandardsBuilder
│       └── StandardDetail
├── Activities tab (icon: task-alt, label: "Activities")
│   └── ActivitiesStack
│       └── Scorecard / ActivityHistory
└── Settings tab (icon: settings)
    └── SettingsStack
        ├── SettingsRoot
        ├── Categories
        ├── Activities
        └── Snapshots…
```

### New Navigation

```
BottomTabNavigator (standard BottomTabBar — no StickyLogButton)
├── Standards tab (icon: pending-actions, label: "Standards")
│   └── StandardsStack
│       ├── StandardsScreen (initial) ← unified active view + inactive toggle
│       ├── StandardDetail
│       └── StandardPeriodActivityLogs
├── Scorecard tab (icon: analytics, label: "Scorecard")
│   └── ScorecardStack
│       └── ScorecardScreen (initial)
├── Settings tab (icon: settings, label: "Settings")
│   └── SettingsStack
│       ├── SettingsRoot ← gains "Standards" management row
│       ├── Standards ← relocated StandardsLibraryScreen
│       ├── Categories
│       ├── Activities
│       └── Snapshots…
└── + tab (icon: add-circle-outline, label: "Create")
    └── (intercepted — opens CreateStandardStack modally)
        ├── SelectActivityStep (Step 1)
        ├── SetVolumeStep (Step 2)
        └── SetPeriodStep (Step 3)
```

### Key Structural Changes

| Change | Details |
|--------|---------|
| **Dashboard tab removed** | Merged into the new Standards tab. The unified StandardsScreen replaces ActiveStandardsDashboard. |
| **Standards tab becomes primary** | Shows active standards with progress, sort, category filters. Kebab menu adds "Show Time Bar", "Show Inactive Standards", "Manage Standards". |
| **Library tab removed from bottom nav** | StandardsLibraryScreen moves to Settings stack. Accessible from Settings directly and via "Manage Standards" cross-navigation. |
| **Activities tab → Scorecard tab** | Renamed, new `analytics` icon. Same underlying screen. |
| **"+" tab intercepts press** | Does not render a screen in the tab. Instead, `tabPress` listener opens CreateStandardStack as a modal stack. |
| **StickyLogButton removed** | Floating log button above tab bar is removed entirely. Logging happens via standard card actions. |
| **TabBarWithStickyLogButton removed** | Custom tab bar wrapper no longer needed. Use default `BottomTabBar` with theme styling. |

## Component Changes

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `BottomSheet.tsx` | `src/components/BottomSheet.tsx` | Base bottom sheet (ported from ledger_mobile) |
| `BottomSheetMenu.tsx` | `src/components/BottomSheetMenu.tsx` | Menu variant: title + list of action items with icons |
| `BottomSheetConfirmation.tsx` | `src/components/BottomSheetConfirmation.tsx` | Two-action confirmation (Cancel + primary/destructive) |
| `StandardsScreen.tsx` | `src/screens/StandardsScreen.tsx` | Unified active standards view with inactive toggle and kebab menu |
| `SelectActivityStep.tsx` | `src/screens/create-standard/SelectActivityStep.tsx` | Step 1: Activity selection with category display |
| `SetVolumeStep.tsx` | `src/screens/create-standard/SetVolumeStep.tsx` | Step 2: Volume + sessions config |
| `SetPeriodStep.tsx` | `src/screens/create-standard/SetPeriodStep.tsx` | Step 3: Period + day-of-week selection |
| `StepProgressIndicator.tsx` | `src/components/StepProgressIndicator.tsx` | 3-step progress dots for Create flow |
| `MethodologyTip.tsx` | `src/components/MethodologyTip.tsx` | Inline tip + "Learn More" expandable for Create steps |

### Modified Components

| Component | Changes |
|-----------|---------|
| `BottomTabNavigator.tsx` | New 4-tab structure, remove TabBarWithStickyLogButton, add "+" tab press interceptor |
| `uiPreferencesStore.ts` | Add `showTimeBar: boolean` (default: true), `showInactiveStandards: boolean` (default: false) |
| `standardsBuilderStore.ts` | Add `reset()` method, add `loadFromStandard(standard)` for edit mode if not present |
| `SettingsScreen.tsx` | Add "Standards" management row to settings menu |
| `StandardCard.tsx` | Replace custom overlay menu with `BottomSheetMenu` |
| `StandardProgressCard.tsx` | Conditional time bar rendering based on `showTimeBar` preference |
| `StandardsLibraryScreen.tsx` | Adapt navigation for Settings stack context (use React Navigation header instead of custom `onBack`) |
| `RangeFilterDrawer.tsx` | Refactor to wrap new `BottomSheet` component |

### Removed Components

| Component | Reason |
|-----------|--------|
| `StickyLogButton.tsx` | FR-003: Floating log button removed |
| `TabBarWithStickyLogButton` (in BottomTabNavigator.tsx) | No longer needed without StickyLogButton |

## Alert.alert Migration Map

| Current Location | Context | New Pattern |
|------------------|---------|-------------|
| `StandardsLibraryScreen.tsx` | Delete standard confirmation | `BottomSheetConfirmation` (destructive) |
| `StandardsLibraryScreen.tsx` | Delete error | Inline `ErrorBanner` (already exists) |
| `ActivityLibraryScreen.tsx` | Delete activity confirmation | `BottomSheetConfirmation` (destructive) |
| `ActivityLibraryScreen.tsx` | Delete/restore errors | Inline `ErrorBanner` |
| `StandardsBuilderScreen.tsx` | Create/update success | Auto-dismiss + navigate back |
| `StandardsBuilderScreen.tsx` | Existing standard activated | Info `BottomSheet` notification |
| `ActiveStandardsDashboardScreen.tsx` | Deactivate error | Inline `ErrorBanner` |
| `LogEntryModal.tsx` | Success (iOS Alert / Android Toast) | Keep platform-appropriate toast pattern |

## Project Structure

### Documentation (this feature)

```
kitty-specs/001-standards-navigation-overhaul/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: research decisions
├── data-model.md        # Phase 1: entity model
└── tasks.md             # Phase 2 output (created by /spec-kitty.tasks)
```

### Source Code (repository root)

```
apps/mobile/src/
├── components/
│   ├── BottomSheet.tsx           # NEW: base bottom sheet (ported)
│   ├── BottomSheetMenu.tsx       # NEW: menu variant
│   ├── BottomSheetConfirmation.tsx # NEW: confirmation variant
│   ├── StepProgressIndicator.tsx # NEW: 3-step progress dots
│   ├── MethodologyTip.tsx        # NEW: inline tip + learn more
│   ├── StandardCard.tsx          # MODIFIED: bottom sheet menu
│   ├── StandardProgressCard.tsx  # MODIFIED: conditional time bar
│   ├── RangeFilterDrawer.tsx     # MODIFIED: wrap BottomSheet
│   ├── StickyLogButton.tsx       # REMOVED
│   └── LogEntryModal.tsx         # UNCHANGED: keeps platform toast pattern
├── navigation/
│   └── BottomTabNavigator.tsx    # MODIFIED: new 4-tab structure
├── screens/
│   ├── StandardsScreen.tsx       # NEW: unified standards view
│   ├── create-standard/
│   │   ├── SelectActivityStep.tsx  # NEW: step 1
│   │   ├── SetVolumeStep.tsx       # NEW: step 2
│   │   └── SetPeriodStep.tsx       # NEW: step 3
│   ├── StandardsLibraryScreen.tsx    # MODIFIED: settings stack context
│   ├── SettingsScreen.tsx            # MODIFIED: add Standards row
│   ├── ActiveStandardsDashboardScreen.tsx  # REMOVED (replaced by StandardsScreen)
│   └── StandardsBuilderScreen.tsx    # REMOVED (replaced by create-standard/ screens)
├── stores/
│   ├── uiPreferencesStore.ts     # MODIFIED: +showTimeBar, +showInactiveStandards
│   └── standardsBuilderStore.ts  # MODIFIED: +reset(), +loadFromStandard()
└── theme/
    └── (no changes)

packages/
├── shared-model/src/types.ts    # POTENTIALLY MODIFIED: verify Activity.categoryId
├── firestore-model/             # (no changes expected)
└── ui-kit/                      # (no changes expected)
```

**Structure Decision**: Mobile monorepo. Feature changes are concentrated in `apps/mobile/src/` with potential type updates in `packages/shared-model/`.

## Complexity Tracking

*No constitution violations to justify.*

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Category–Activity data model gap | Step 1 of Create flow can't display category info | Verify Firestore schema first; add `categoryId` to Activity type if missing (see research R6) |
| "+" tab press interception | Non-standard tab behavior may confuse users | Use `tabPress` listener to prevent default + navigate to modal stack; style the "+" tab distinctly |
| Bottom sheet porting | Theme token differences between ledger_mobile and minimum_standards | Both use `@nine4/ui-kit`; direct mapping confirmed. Test dark mode specifically. |
| Removing Dashboard tab | Users lose the familiar "Active" entry point | The new Standards screen IS the Active screen (same data, same progress cards). Naming change only. |
| Edit mode in new Create flow | Pre-populating 3 separate screens from existing standard | `standardsBuilderStore.loadFromStandard()` sets all fields; each screen reads from store. Test round-trip editing. |
