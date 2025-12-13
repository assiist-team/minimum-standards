# Task Breakdown: Standard Detail + History

## Overview
Total Tasks: 24

## Task List

### Data Layer & Hooks

#### Task Group 1: Period history data retrieval
**Dependencies:** None

- [x] 1.0 Provide period history data for a standard
  - [x] 1.1 Write 4 focused tests for period history computation
    - Test period window calculation for multiple periods going back in time
    - Test log aggregation per period using deterministic period windows
    - Test status derivation for historical periods (Met/In Progress/Missed)
    - Test empty history handling (no logs exist)
  - [x] 1.2 Create utility function to compute all periods with logs for a standard
    - Use `calculatePeriodWindow` and `derivePeriodStatus` from `packages/shared-model/src/period-calculator.ts`
    - Iterate backwards through periods until no logs found
    - Return array of period summaries (label, total, target, status, progressPercent) ordered most-recent-first
    - Reuse `formatStandardSummary` for target formatting
  - [x] 1.3 Create hook `useStandardHistory` to fetch and compute period history
    - Accept `standardId` and `timezone` parameters
    - Subscribe to logs for the standard (filter by `standardId`, exclude `deletedAt`)
    - Compute period history using utility from 1.2
    - Return loading, error, and history array states
    - Reuse log subscription pattern from `useActiveStandardsDashboard.ts`
  - [x] 1.4 Create hook `usePeriodLogs` to fetch logs for a specific period
    - Accept `standardId`, `periodStartMs`, `periodEndMs` parameters
    - Query logs where `occurredAt` is within period window and `deletedAt` is null
    - Return logs array with `id`, `value`, `occurredAtMs`, `note` fields
    - Handle loading and error states
  - [x] 1.5 Run only the tests written in 1.1

**Acceptance Criteria:**
- The 4 tests written in 1.1 pass
- Period history computation uses deterministic period windows matching dashboard logic
- Hook correctly filters out soft-deleted logs
- History array is ordered most-recent-first
- Empty history returns empty array without errors

### React Native UI Implementation

#### Task Group 2: Dashboard card interaction updates
**Dependencies:** None

- [x] 2.0 Update dashboard card to support tap-to-detail navigation
  - [x] 2.1 Write 3 focused tests for card interaction
    - Test card body tap navigates to detail screen
    - Test Log button tap opens logging modal (does not navigate)
    - Test Log button placement next to progress bar (not in footer)
  - [x] 2.2 Update `StandardCard` component in `ActiveStandardsDashboardScreen.tsx`
    - Make card body tappable (wrap in `TouchableOpacity` or add `onPress` handler)
    - Move Log button from footer to be adjacent to progress bar
    - Ensure Log button has distinct tap target (no gesture conflicts)
    - Pass `onCardPress` callback prop to navigate to detail screen
  - [x] 2.3 Update `ActiveStandardsDashboardScreen` to handle card tap navigation
    - Add navigation handler that receives `standardId` and navigates to detail screen
    - Ensure Log button handler remains separate and functional
  - [x] 2.4 Run only the tests written in 2.1

**Acceptance Criteria:**
- The 3 tests written in 2.1 pass
- Card body tap navigates to detail screen without triggering Log action
- Log button is positioned next to progress bar, reducing vertical card height
- No gesture conflicts between card tap and Log button

#### Task Group 3: Standard detail screen foundation
**Dependencies:** Task Group 1

- [x] 3.0 Build Standard detail screen shell
  - [x] 3.1 Write 4 focused tests for detail screen
    - Test screen renders with standard data
    - Test loading state displays skeleton
    - Test error state displays error banner with retry
    - Test empty history state shows minimal empty message
  - [x] 3.2 Create `StandardDetailScreen.tsx` component
    - Accept `standardId` prop and navigation callbacks (`onBack`, `onEdit`, `onArchive`)
    - Use `useStandardHistory` hook from Task Group 1
    - Implement screen shell with header (back button, standard name/title)
    - Add loading skeleton placeholder
    - Add error banner with retry functionality
  - [x] 3.3 Implement current period summary section
    - Display same elements as dashboard card: period label, current total / target summary, status pill, progress bar
    - Reuse status color tokens from `ActiveStandardsDashboardScreen.tsx`
    - Use `DashboardProgress` type and formatting from `dashboardProgress.ts`
  - [x] 3.4 Run only the tests written in 3.1

**Acceptance Criteria:**
- The 4 tests written in 3.1 pass
- Screen displays current period summary matching dashboard card style
- Loading and error states render correctly
- Empty history state shows appropriate message

#### Task Group 4: Period history list component
**Dependencies:** Task Group 3

- [x] 4.0 Build period history list UI
  - [x] 4.1 Write 3 focused tests for history list
    - Test history list renders periods most-recent-first
    - Test period row displays period label, total, target, status, progress indicator
    - Test tapping period row opens logs modal
  - [x] 4.2 Create `PeriodHistoryList` component
    - Accept `history` array from `useStandardHistory` hook
    - Render `FlatList` or `ScrollView` with period rows
    - Each row shows: period label, total / target summary, status pill, progress bar
    - Use same status color tokens and progress bar styling as dashboard
    - Make rows tappable to open logs modal
  - [x] 4.3 Integrate history list into `StandardDetailScreen`
    - Add section header "History" or similar
    - Display history list below current period summary
    - Handle empty history state (show message, no list)
  - [x] 4.4 Run only the tests written in 4.1

**Acceptance Criteria:**
- The 3 tests written in 4.1 pass
- History list displays periods ordered most-recent-first
- Period rows match dashboard card styling (status colors, progress bars)
- Tapping a period row triggers logs modal

#### Task Group 5: Per-period logs modal
**Dependencies:** Task Group 4

- [x] 5.0 Build logs modal for selected period
  - [x] 5.1 Write 3 focused tests for logs modal
    - Test modal opens when period row is tapped
    - Test modal displays logs list with value, occurred date/time, note
    - Test modal filters out soft-deleted logs
  - [x] 5.2 Create `PeriodLogsModal.tsx` component
    - Accept `visible`, `standardId`, `periodStartMs`, `periodEndMs`, `onClose` props
    - Use `usePeriodLogs` hook from Task Group 1
    - Display modal with header (period label, close button)
    - Render scrollable list of logs showing: value, formatted occurred date/time, note (if present)
    - Handle loading and error states within modal
  - [x] 5.3 Integrate logs modal into `StandardDetailScreen`
    - Add state to track selected period (start/end timestamps)
    - Wire period row tap to open modal with selected period
    - Pass period data to `PeriodLogsModal`
  - [x] 5.4 Run only the tests written in 5.1

**Acceptance Criteria:**
- The 3 tests written in 5.1 pass
- Modal displays logs for selected period in scrollable list
- Logs show value, occurred date/time, and note (when present)
- Soft-deleted logs are excluded from display

#### Task Group 6: Detail screen actions
**Dependencies:** Task Group 3

- [x] 6.0 Implement action buttons (Log, Edit, Archive/Unarchive)
  - [x] 6.1 Write 3 focused tests for actions
    - Test Log button opens logging modal with standard preselected
    - Test Edit button navigates to Standards Builder with standard data
    - Test Archive/Unarchive button toggles archive state
  - [x] 6.2 Add action buttons to `StandardDetailScreen`
    - Add Log button that opens `LogEntryModal` with `standard` prop preselected
    - Add Edit button that navigates to Standards Builder (pass standard data via callback)
    - Add Archive/Unarchive button (show Archive if active, Unarchive if archived)
    - Use `useStandards` hook for `archiveStandard`/`unarchiveStandard` functions
  - [x] 6.3 Wire Log action to `LogEntryModal`
    - Ensure `LogEntryModal` receives `standard` prop when opened from detail screen
    - Verify quick-add chips display if `standard.quickAddValues` exists
    - Handle save success callback (close modal, refresh history)
  - [x] 6.4 Run only the tests written in 6.1

**Acceptance Criteria:**
- The 3 tests written in 6.1 pass
- Log button opens modal with standard preselected
- Edit button navigates to builder with standard context
- Archive/Unarchive toggles state correctly

### States, Accessibility, and Theming

#### Task Group 7: Error handling and empty states
**Dependencies:** Task Groups 3-6

- [x] 7.0 Polish error handling and empty states
  - [x] 7.1 Write 2 focused tests for error/empty states
    - Test empty history state shows message and Log action still available
    - Test Firestore error displays actionable error message with retry
  - [x] 7.2 Implement empty history state
    - Show minimal empty message when no logs exist
    - Ensure current period summary still displays (may show 0 / target)
    - Keep Log action available even with empty history
  - [x] 7.3 Enhance error handling
    - Surface Firestore failures with actionable error message
    - Provide retry button that re-subscribes to data
    - Ensure errors fail gracefully without crashing screen
  - [x] 7.4 Run only the tests written in 7.1

**Acceptance Criteria:**
- The 2 tests written in 7.1 pass
- Empty history shows appropriate message without charts
- Current period summary and Log action remain accessible
- Errors display actionable messages with retry functionality

#### Task Group 8: Accessibility and theming
**Dependencies:** Task Groups 3-6

- [x] 8.0 Ensure accessibility and theme compliance
  - [x] 8.1 Write 2 focused tests for accessibility
    - Test screen has proper `accessibilityLabel` strings for key elements
    - Test status colors meet contrast requirements in dark mode
  - [x] 8.2 Audit and add accessibility labels
    - Add `accessibilityLabel` for period rows, action buttons, progress bars
    - Ensure VoiceOver/TalkBack navigation is intuitive
    - Add `accessibilityRole` attributes where appropriate
  - [x] 8.3 Verify theme support
    - Ensure status colors work in both light and dark themes
    - Test progress bars and text meet contrast requirements
    - Verify modal styling adapts to theme
  - [x] 8.4 Run only the tests written in 8.1

**Acceptance Criteria:**
- The 2 tests written in 8.1 pass
- Screen usable via VoiceOver/TalkBack with descriptive labels
- Status colors and progress visuals meet contrast requirements in both themes

### Analytics & Observability

#### Task Group 9: Instrumentation
**Dependencies:** Task Groups 3-6

- [x] 9.0 Track detail screen interactions
  - [x] 9.1 Write 2 focused tests (or mocked assertions) for analytics
    - Test analytics fired on detail screen open
    - Test analytics fired on period row tap and action button taps
  - [x] 9.2 Extend `apps/mobile/src/utils/analytics.ts`
    - Add `standard_detail_view` event (include `standardId`, `activityId`)
    - Add `standard_detail_period_tap` event (include `standardId`, `periodLabel`)
    - Add `standard_detail_log_tap`, `standard_detail_edit_tap`, `standard_detail_archive_tap` events
  - [x] 9.3 Fire analytics within detail screen
    - Track screen view on mount
    - Track period row taps with period context
    - Track action button interactions
    - Ensure failures fail silently (no crashes)
  - [x] 9.4 Run only the tests written in 9.1

**Acceptance Criteria:**
- The 2 tests written in 9.1 pass
- All primary interactions emit analytics with consistent payload shapes
- No crashes occur if analytics initialization fails

### Feature QA & Gap Testing

#### Task Group 10: Integrated workflow validation
**Dependencies:** Task Groups 1-9

- [x] 10.0 Validate end-to-end scenarios
  - [x] 10.1 Review tests from groups 1-9 and list remaining gaps
    - Review period history computation, detail screen rendering, period logs modal, actions, error states
  - [x] 10.2 Add up to 6 additional integration tests
    - Test navigation flow: dashboard card tap → detail screen → period tap → logs modal
    - Test logging from detail screen updates history
    - Test archive/unarchive from detail screen updates state
    - Test period history accuracy across multiple periods
    - Test empty history → log entry → history appears
    - Test error recovery (retry after Firestore failure)
  - [x] 10.3 Run feature-specific test suites
    - Run tests from 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.2
    - Expected total: approximately 30-36 tests maximum
    - Verify critical workflows pass
  - [x] 10.4 File/flag any blocking defects before handing off for review

**Acceptance Criteria:**
- Feature-specific tests pass (approximately 30-36 executions total)
- Navigation, logging, history display, and action workflows behave correctly on device/emulator
- Documented gaps (if any) have follow-up tickets

## Execution Order

1. Data Layer & Hooks (Task Group 1)
2. Dashboard card interaction updates (Task Group 2) - can run in parallel with Task Group 1
3. Standard detail screen foundation (Task Group 3)
4. Period history list component (Task Group 4)
5. Per-period logs modal (Task Group 5)
6. Detail screen actions (Task Group 6) - can run in parallel with Task Groups 4-5
7. Error handling and empty states (Task Group 7)
8. Accessibility and theming (Task Group 8)
9. Analytics & Observability (Task Group 9)
10. Feature QA & Gap Testing (Task Group 10)
