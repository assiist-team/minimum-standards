---
work_package_id: WP01
title: Bottom Sheet Foundation
lane: "done"
dependencies: []
base_branch: main
base_commit: e0118f5627f371ed90dfdd5050900258988c33ee
created_at: '2026-02-11T23:01:26.425039+00:00'
subtasks:
- T001
- T002
- T003
phase: Phase 0 - Foundation
assignee: ''
agent: "claude-opus"
shell_pid: "15800"
review_status: "approved"
reviewed_by: "nine4-team"
history:
- timestamp: '2026-02-11T22:17:53Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
---

# Work Package Prompt: WP01 – Bottom Sheet Foundation

## Objectives & Success Criteria

- Create three reusable bottom sheet components that serve as the foundation for all menu and confirmation UIs in the app.
- Components must match the ledger_mobile reference pattern: 18px top border radius, 1px border, 42×4px handle bar, 160–180ms animation.
- Each component should be independently importable and fully self-contained.
- All components must support light/dark theme via the existing `useTheme()` hook.

**Definition of Done**:
- [ ] `BottomSheet` renders with correct styling, animates in, dismisses on backdrop tap
- [ ] `BottomSheetMenu` renders a list of action items with icons and Title Case labels
- [ ] `BottomSheetConfirmation` renders a destructive action confirmation with cancel/confirm
- [ ] All three components integrate with the project's theme system

## Context & Constraints

- **Reference implementation**: `/Users/benjaminmackenzie/Dev/ledger_mobile/src/components/BottomSheet.tsx` (130 lines, production-tested)
- **Reference menu**: `/Users/benjaminmackenzie/Dev/ledger_mobile/src/components/BottomSheetMenuList.tsx` (full action list implementation)
- **Theme hook**: `apps/mobile/src/theme/useTheme.ts` — returns theme object with `colors` property
- **Design system**: `@nine4/ui-kit` provides `typography`, `BUTTON_BORDER_RADIUS` constants
- **Spec requirement FR-014**: Bottom sheets MUST include handle bar, semi-transparent backdrop, slide-up animation, backdrop-tap dismissal
- **Spec requirement FR-015**: 18px top border radius, 1px border, handle bar 42×4px, 160–180ms animation
- **Spec requirement FR-016**: All menu item labels MUST use Title Case
- **No new dependencies**: Use `react-native` built-in `Animated`, `Modal`, `Pressable`
- **Implementation command**: `spec-kitty implement WP01`

## Subtasks & Detailed Guidance

### Subtask T001 – Create BottomSheet Base Component

- **Purpose**: Provide the foundational sheet container used by all bottom sheet variants. This is the core primitive that handles overlay, animation, and dismissal.

- **Steps**:
  1. Create `apps/mobile/src/components/BottomSheet.tsx`
  2. Port the implementation from the ledger_mobile reference (`/Users/benjaminmackenzie/Dev/ledger_mobile/src/components/BottomSheet.tsx`), adapting theme integration:
     - Replace `useUIKitTheme()` with the local `useTheme()` from `../theme/useTheme`
     - Map theme tokens: `theme.colors.background` → sheet background, `theme.colors.border` → border color, `theme.colors.text` → handle bar color
  3. Implement the exact styling from the spec:
     - Sheet: `borderTopLeftRadius: 18`, `borderTopRightRadius: 18`, `borderWidth: 1`, `overflow: 'hidden'`, `paddingTop: 8`
     - Handle bar: `width: 42`, `height: 4`, `borderRadius: 999`, `alignSelf: 'center'`, `marginBottom: 8`, `opacity: 0.9`
     - Overlay: `rgba(0, 0, 0, 0.35)`
  4. Animation:
     - `translateY`: starts at 24, animates to 0 over 180ms with `useNativeDriver: true`
     - `overlayOpacity`: starts at 0, animates to 1 over 160ms with `useNativeDriver: true`
     - Both run in `Animated.parallel()`
  5. Dismissal: `Pressable` covering `StyleSheet.absoluteFill` behind the sheet triggers `onRequestClose`
  6. Use `Modal` with `transparent`, `animationType: "none"`, `statusBarTranslucent` on Android
  7. Account for safe area: `paddingBottom: Math.max(12, insets.bottom)` via `useSafeAreaInsets()`

- **Props interface**:
  ```typescript
  export interface BottomSheetProps {
    visible: boolean;
    onRequestClose: () => void;
    onDismiss?: () => void;
    containerStyle?: ViewStyle;
    children: React.ReactNode;
  }
  ```

- **Files**: `apps/mobile/src/components/BottomSheet.tsx` (new, ~130 lines)
- **Parallel?**: Yes — independent of T002 and T003.

- **Validation**:
  - [ ] Sheet renders with 18px border radius and 1px border
  - [ ] Handle bar is 42×4px, centered
  - [ ] Overlay fades in at 160ms
  - [ ] Sheet slides up at 180ms
  - [ ] Tapping backdrop calls `onRequestClose`
  - [ ] Safe area padding applied at bottom

### Subtask T002 – Create BottomSheetMenu Component

- **Purpose**: Provide a standardized menu list component for action menus, sort menus, and option selectors. Replaces all current `Alert.alert()` and custom overlay menus.

- **Steps**:
  1. Create `apps/mobile/src/components/BottomSheetMenu.tsx`
  2. Design the props interface:
     ```typescript
     export interface BottomSheetMenuItem {
       key: string;
       label: string;           // Must be Title Case
       icon?: string;           // MaterialIcons name
       onPress: () => void;
       destructive?: boolean;   // Red text for destructive actions
       disabled?: boolean;
     }

     export interface BottomSheetMenuProps {
       visible: boolean;
       onRequestClose: () => void;
       items: BottomSheetMenuItem[];
       title?: string;          // Optional header title
     }
     ```
  3. Render a `BottomSheet` with a flat list of `Pressable` menu items:
     - Each item: icon (optional, `MaterialIcons`, 20px) + label text
     - Dividers between items: `StyleSheet.hairlineWidth`, theme border color
     - Pressed state: `opacity: 0.7`
     - Destructive items: label text in red/error color from theme
  4. Optional title row at top with larger bold text and bottom border
  5. Items execute their `onPress` callback after dismissing the sheet (store pending action, close modal, execute on next frame — same pattern as ledger_mobile reference)
  6. All labels enforced as Title Case at the component level (or documented as caller responsibility)
  7. Import `MaterialIcons` from `react-native-vector-icons/MaterialIcons` (already a project dependency)

- **Files**: `apps/mobile/src/components/BottomSheetMenu.tsx` (new, ~120 lines)
- **Parallel?**: Yes — uses BottomSheet but can be built simultaneously.

- **Validation**:
  - [ ] Menu renders with list of items
  - [ ] Each item shows icon + label in Title Case
  - [ ] Tapping item dismisses sheet then executes action
  - [ ] Destructive items show in red/error color
  - [ ] Optional title header renders when provided

### Subtask T003 – Create BottomSheetConfirmation Component

- **Purpose**: Provide a standardized confirmation dialog for destructive actions (Delete, Deactivate, Archive). Replaces `Alert.alert()` with confirm/cancel pattern.

- **Steps**:
  1. Create `apps/mobile/src/components/BottomSheetConfirmation.tsx`
  2. Design the props interface:
     ```typescript
     export interface BottomSheetConfirmationProps {
       visible: boolean;
       onRequestClose: () => void;
       title: string;
       message: string;
       confirmLabel?: string;    // Default: "Confirm"
       cancelLabel?: string;     // Default: "Cancel"
       destructive?: boolean;    // Default: true — confirm button in red
       onConfirm: () => void;
       onCancel?: () => void;    // Default: onRequestClose
     }
     ```
  3. Render a `BottomSheet` with:
     - Title text (bold, 16px)
     - Message text (regular, 14px, secondary color)
     - Two buttons in a row at bottom:
       - Cancel: outlined/ghost style, theme text color
       - Confirm: filled style, red/error color if destructive, primary color otherwise
     - Buttons use `BUTTON_BORDER_RADIUS` from `@nine4/ui-kit`
  4. Confirm button executes action after dismissing sheet (same deferred pattern)
  5. Cancel button simply closes the sheet

- **Files**: `apps/mobile/src/components/BottomSheetConfirmation.tsx` (new, ~100 lines)
- **Parallel?**: Yes — uses BottomSheet but can be built simultaneously.

- **Validation**:
  - [ ] Confirmation renders with title, message, and two buttons
  - [ ] Confirm button is red for destructive actions
  - [ ] Tapping confirm dismisses sheet then executes callback
  - [ ] Tapping cancel dismisses sheet without action
  - [ ] Tapping backdrop dismisses sheet without action

## Risks & Mitigations

- **Theme token mismatch**: The ledger_mobile reference uses `useUIKitTheme()` which may expose different token names than `useTheme()` in minimum_standards. Verify the theme object structure by reading `apps/mobile/src/theme/useTheme.ts` and mapping colors accordingly.
- **Animation performance**: Using `useNativeDriver: true` ensures smooth 60fps animation. Do not use layout properties (width, height, padding) with native driver.
- **Modal stacking**: If multiple bottom sheets are open simultaneously (e.g., menu → confirmation), ensure only one `Modal` is visible at a time. The confirmation should replace the menu, not stack on top.

## Review Guidance

- Verify all three components render correctly in both light and dark themes.
- Confirm animation timing matches spec (160ms overlay, 180ms sheet).
- Check that the deferred action pattern works: action executes AFTER modal dismiss animation completes.
- Verify handle bar dimensions: exactly 42×4px.
- Confirm `useSafeAreaInsets()` padding is applied correctly on devices with home indicator (iPhone X+).

## Activity Log

- 2026-02-11T22:17:53Z – system – lane=planned – Prompt created.
- 2026-02-11T23:01:26Z – claude-opus – shell_pid=89363 – lane=doing – Assigned agent via workflow command
- 2026-02-11T23:06:08Z – claude-opus – shell_pid=89363 – lane=for_review – Ready for review: BottomSheet, BottomSheetMenu, and BottomSheetConfirmation components implemented following ledger_mobile reference pattern with local theme integration
- 2026-02-11T23:13:40Z – claude-opus – shell_pid=15800 – lane=doing – Started review via workflow command
- 2026-02-11T23:19:50Z – claude-opus – shell_pid=15800 – lane=done – Review passed: All three components (BottomSheet, BottomSheetMenu, BottomSheetConfirmation) match spec requirements. Faithful port from ledger_mobile reference with correct useTheme() integration. Styling, animation timing, deferred action pattern, and dependency constraints all verified.
