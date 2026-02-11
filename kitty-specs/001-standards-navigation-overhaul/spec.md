# Feature Specification: Standards Navigation Overhaul

**Feature Branch**: `001-standards-navigation-overhaul`
**Created**: 2026-02-11
**Status**: Draft
**Mission**: software-dev

## User Scenarios & Testing

### User Story 1 — Unified Standards Screen (Priority: P1)

A user opens the app and lands on the **Standards** tab (formerly "Active"). They see their active standards with progress bars, category filters, and sort options — the same experience they had on the old Active screen. From the kebab menu, they can toggle **Show Time Bar** and **Show Inactive Standards**. When inactive standards are shown, each one displays in a visually distinct (dimmed/muted) state with an action menu offering **Reactivate**, **Delete**, and **View Logs**.

**Why this priority**: This is the core structural change — merging Active and Library into one screen. Everything else depends on this screen existing and working correctly.

**Independent Test**: Navigate to the Standards tab, verify active standards display. Toggle "Show Inactive Standards" on, verify inactive standards appear with correct action menus. Reactivate one, delete one, view logs on one.

**Acceptance Scenarios**:

1. **Given** the user has active and inactive standards, **When** they open the Standards tab, **Then** only active standards are displayed by default.
2. **Given** the user is on the Standards screen, **When** they open the menu and toggle "Show Inactive Standards" on, **Then** inactive standards appear in a visually distinct state below active standards.
3. **Given** inactive standards are visible, **When** the user taps the action menu on an inactive standard, **Then** a bottom sheet appears with "Reactivate", "Delete", and "View Logs" options.
4. **Given** the user taps "Reactivate" on an inactive standard, **When** the action completes, **Then** the standard moves to the active list with its progress reset for the current period.
5. **Given** the user is on the Standards screen, **When** they open the menu and toggle "Show Time Bar" off, **Then** the time/progress bar is hidden from all standard cards.
6. **Given** the user opens the menu, **Then** all menu items are displayed in Title Case.

---

### User Story 2 — Restructured Bottom Navigation (Priority: P1)

The bottom navigation shows four items: **Standards**, **Scorecard**, **Settings**, and a **"+"** (Create) button on the far right. The Standards tab uses the icon previously used for Library (`pending-actions`). Scorecard has a new icon. The Log button that previously floated above the tab bar is removed.

**Why this priority**: The navigation restructure is foundational — the new tab layout and "+" button are required before other flows can be wired up.

**Independent Test**: Launch the app, verify the bottom nav shows exactly four items in order: Standards, Scorecard, Settings, +. Verify the old Library tab and floating Log button are gone.

**Acceptance Scenarios**:

1. **Given** the user opens the app, **When** the bottom navigation renders, **Then** it displays exactly four items: Standards, Scorecard, Settings, + (Create).
2. **Given** the bottom nav is visible, **When** the user looks at the Standards tab icon, **Then** it uses the `pending-actions` MaterialIcons icon (formerly the Library icon).
3. **Given** the bottom nav is visible, **Then** the Scorecard tab displays a new, distinct icon.
4. **Given** the user is on any screen, **Then** there is no floating Log button above the tab bar.
5. **Given** the user taps the "+" button, **Then** the Create Standard flow opens.

---

### User Story 3 — Survey-Style Create Standard Flow (Priority: P1)

The user taps the "+" button in the bottom nav. A full-screen, survey-style flow begins with one step per screen and forward/back navigation.

**Step 1 — Select or Create Activity**: The user picks from existing activities or creates a new one. When an activity is selected, its unit and category are displayed beneath it (e.g., "Unit: minutes" / "Category: Fitness"). If no category is assigned, it shows "Category: None". The user can also assign or change the category here. A brief inline tip reads: *"Pick the activity that, if you did enough of it, would make success almost guaranteed."* A "Learn More" link opens a fuller explanation of how to choose an activity.

**Step 2 — Set Volume**: The user enters the target volume for the period. The unit is inherited from the activity and is not editable on this screen (shown as context only). A toggle labeled "Break Volume into Sessions" allows splitting the total into sessions. Inline tip: *"Start where you can consistently win, not at your ideal level."* "Learn More" expands on progressive volume building.

**Step 3 — Set Period**: The user chooses a period (Daily, Weekly, Monthly, Custom). Day-of-week selectors (Mo–Su) are hidden by default and revealed via a toggle. Border radius on all elements is normalized to match the app's design system. Inline tip: *"Focus on total volume per period — flexibility beats rigid daily targets."* "Learn More" explains the methodology behind flexible period targets.

Each screen has a progress indicator and consistent forward/back navigation.

**Why this priority**: The Create Standard flow is the primary creation path and needs to work with the new "+" nav button.

**Independent Test**: Tap "+", walk through all three steps creating a new standard. Verify each step is a separate screen, tips display, learn-more expands, category shows under activity, unit is inherited, sessions toggle works, day-of-week toggle works.

**Acceptance Scenarios**:

1. **Given** the user taps "+", **When** the Create Standard flow opens, **Then** Step 1 (Select or Create Activity) is displayed as a full screen.
2. **Given** the user is on Step 1, **When** they select an activity, **Then** the activity's unit and category are displayed below the selection (e.g., "Unit: minutes" / "Category: Fitness").
3. **Given** the selected activity has no category, **When** it is displayed, **Then** the category line reads "Category: None".
4. **Given** the user is on Step 1, **When** they look at the screen, **Then** an inline tip is visible: "Pick the activity that, if you did enough of it, would make success almost guaranteed."
5. **Given** the user taps "Learn More" on any step, **Then** a fuller methodology explanation is displayed.
6. **Given** the user is on Step 2, **Then** the unit field is read-only and inherited from the selected activity.
7. **Given** the user is on Step 2, **When** they toggle "Break Volume into Sessions", **Then** session configuration fields appear.
8. **Given** the user is on Step 3 and selects Weekly, **Then** day-of-week selectors (Mo–Su) are hidden by default.
9. **Given** the user is on Step 3, **When** they toggle on day-of-week selection, **Then** Mo–Su buttons appear.
10. **Given** the user completes all three steps and confirms, **Then** a new active standard is created and visible on the Standards screen.

---

### User Story 4 — Bottom Sheet Menus (Priority: P2)

All action menus, sort menus, confirmation dialogs, and option selectors across the app are presented as bottom sheets. The bottom sheet pattern includes: a handle bar at top, semi-transparent backdrop, slide-up animation, dismissal by tapping outside, and menu items with Title Case labels. This replaces all current `Alert.alert()` dialogs and custom overlay menus.

**Why this priority**: The bottom sheet conversion is a global UX improvement but doesn't block the core structural changes.

**Independent Test**: Trigger any menu or action dialog in the app (standard card menu, sort menu, category management, delete confirmation) and verify it appears as a bottom sheet instead of an alert or dropdown.

**Acceptance Scenarios**:

1. **Given** the user taps a standard card's action menu, **When** the menu opens, **Then** it appears as a bottom sheet sliding up from the bottom of the screen.
2. **Given** a bottom sheet is open, **When** the user taps the backdrop, **Then** the sheet dismisses.
3. **Given** a bottom sheet is open, **Then** a handle bar is visible at the top of the sheet.
4. **Given** any bottom sheet with menu items, **Then** all menu item labels are in Title Case.
5. **Given** a destructive action (Delete, Deactivate), **When** the user selects it, **Then** a confirmation bottom sheet appears before executing the action.

---

### User Story 5 — Active Standard Card Actions via Bottom Sheet (Priority: P2)

On the Standards screen, tapping the action menu on an active standard opens a bottom sheet with options: **Edit**, **Deactivate**, **Delete**, and **Categorize**. Each option is displayed in Title Case.

**Why this priority**: Complements the bottom sheet migration and the unified Standards screen.

**Independent Test**: Tap the three-dot menu on any active standard card. Verify a bottom sheet appears with Edit, Deactivate, Delete, and Categorize options in Title Case.

**Acceptance Scenarios**:

1. **Given** an active standard on the Standards screen, **When** the user taps its action menu, **Then** a bottom sheet opens with "Edit", "Deactivate", "Delete", and "Categorize" options.
2. **Given** the user selects "Edit", **Then** they are navigated to the Create Standard flow pre-populated with that standard's data.
3. **Given** the user selects "Deactivate", **Then** the standard becomes inactive (and appears in the inactive list if "Show Inactive Standards" is on).

---

### Edge Cases

- What happens when the user has zero standards (both active and inactive)? → Empty state with prompt to create first standard via the "+" button.
- What happens when the user toggles "Show Inactive Standards" off while viewing an inactive standard's logs? → The logs screen remains open; returning to Standards hides inactive items.
- What happens if the user creates an activity without a unit during the Create Standard flow? → The unit field on Step 2 displays "Unit: (none)" and the user can enter volume as a plain number.
- What happens when the user is mid-way through the Create Standard flow and navigates away (e.g., taps a nav tab)? → Flow state is discarded; user starts fresh next time.
- What happens when the user toggles day-of-week selection on and then switches period from Weekly to Daily? → Day-of-week selectors are hidden and the toggle resets.

## Requirements

### Functional Requirements

**Navigation & Screen Structure**

- **FR-001**: The bottom navigation MUST display exactly four items in order: Standards, Scorecard, Settings, + (Create).
- **FR-002**: The Standards Library screen MUST be removed from the bottom navigation and relocated to the Settings stack as a management screen.
- **FR-003**: The floating Log button above the tab bar MUST be removed.
- **FR-004**: The "Active" screen MUST be renamed to "Standards" and serve as the unified standards view.
- **FR-005**: The Standards tab icon MUST use the `pending-actions` MaterialIcons icon.
- **FR-006**: The Scorecard tab MUST display the `analytics` MaterialIcons icon.
- **FR-007**: The "+" button MUST open the Create Standard flow.

**Standards Screen Controls**

- **FR-008**: The Standards screen menu MUST include a "Show Time Bar" toggle that hides/shows progress bars on standard cards.
- **FR-009**: The Standards screen menu MUST include a "Show Inactive Standards" toggle that reveals archived standards on the same screen.
- **FR-009a**: The Standards screen menu MUST include a "Manage Standards" item that cross-navigates to the Standards Library in the Settings stack.
- **FR-010**: Inactive standards MUST be visually distinct from active standards (dimmed, muted, or otherwise differentiated).
- **FR-011**: Inactive standards MUST have an action menu with "Reactivate", "Delete", and "View Logs" options.
- **FR-012**: The "Show Time Bar" and "Show Inactive Standards" preferences MUST persist across app sessions.

**Bottom Sheet Menus**

- **FR-013**: All action menus, sort menus, and confirmation dialogs MUST be presented as bottom sheets.
- **FR-014**: Bottom sheets MUST include a handle bar, semi-transparent backdrop, slide-up animation, and backdrop-tap dismissal.
- **FR-015**: Bottom sheet style MUST follow the ledger_mobile reference pattern (18px top border radius, 1px border, handle bar 42x4px, 160-180ms animation).
- **FR-016**: All menu item labels MUST use Title Case.

**Create Standard Flow**

- **FR-017**: The Create Standard flow MUST present one step per screen in a survey-style progression with forward/back navigation.
- **FR-018**: Step 1 (Activity) MUST allow selecting an existing activity or creating a new one.
- **FR-019**: Step 1 MUST display the selected activity's unit and category inline (e.g., "Unit: minutes" / "Category: Fitness" or "Category: None").
- **FR-020**: Step 1 MUST allow assigning or changing the activity's category.
- **FR-021**: Step 2 (Volume) MUST inherit the unit from the selected activity and display it as read-only context.
- **FR-022**: Step 2 MUST include a toggle labeled "Break Volume into Sessions" (not "Break this volume into session").
- **FR-023**: Step 3 (Period) MUST offer Daily, Weekly, Monthly, and Custom period options.
- **FR-024**: Step 3 MUST hide day-of-week (Mo-Su) selectors by default and reveal them via a toggle.
- **FR-025**: Step 3 MUST use normalized border radius consistent with the app's design system.
- **FR-026**: Each step MUST display an inline contextual tip related to the Minimum Standards methodology.
- **FR-027**: Each step MUST include a "Learn More" element that reveals a fuller methodology explanation.
- **FR-028**: The flow MUST include a progress indicator showing the current step.

### Key Entities

- **Standard**: Represents a user's commitment to a minimum volume of an activity over a period. Can be active or inactive (archived). Key attributes: activity, volume, unit (inherited from activity), period, sessions configuration, active/archived status.
- **Activity**: A trackable action with a name, unit of measurement, and optional category. Shared across standards. Key attributes: name, unit, categoryId.
- **Category**: A user-defined grouping for activities. Key attributes: name, display order.
- **Activity Log**: A record of work performed toward a standard. Key attributes: standard, volume, timestamp.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can create a new standard via the "+" button in under 90 seconds across all three steps.
- **SC-002**: Users can find and reactivate an inactive standard in under 3 taps from the Standards screen.
- **SC-003**: 100% of menus and action dialogs render as bottom sheets (zero `Alert.alert()` or overlay menus remain).
- **SC-004**: The bottom navigation displays exactly 4 items with no visual overflow or layout issues across supported device sizes.
- **SC-005**: All methodology helper text is accessible within each Create Standard step without leaving the flow.
- **SC-006**: Show/Hide preferences for time bar and inactive standards persist correctly across app restarts.
