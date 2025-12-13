# Task Breakdown: Active Standards Dashboard

## Overview
Total Tasks: 22

## Task List

### Firestore & Hook Foundations

#### Task Group 1: Pin persistence and data shaping  
**Dependencies:** None

- [x] 1.0 Establish pin ordering persistence
  - [x] 1.1 Write 4 focused unit tests for pin reducer ordering (pins first, then fallback sort) and cleanup when standards disappear.
  - [x] 1.2 Define `DashboardPins` schema (`users/{uid}/preferences/dashboardPins`) plus TypeScript interfaces and Firestore converter.
  - [x] 1.3 Add repository helpers to read/write pin order with optimistic updates and server reconciliation.
  - [x] 1.4 Integrate pin metadata into `useStandards` (or a companion hook) so the hook outputs `pinnedStandards` + `orderedActiveStandards`.
  - [x] 1.5 Run only the tests written in 1.1 and verify optimistic pin updates sync correctly.

**Acceptance Criteria:**
- Pin order survives app restarts and matches Firestore persistence.
- Removing/archiving a pinned standard automatically prunes it from the prefs doc.
- Hook consumers receive ordered lists without duplicating sorting logic.

#### Task Group 2: Period context & aggregation utilities  
**Dependencies:** Task Group 1

- [x] 2.0 Provide current-period progress data
  - [x] 2.1 Write 3 focused tests covering period label formatting, capped progress %, and status derivation using mock cadences.
  - [x] 2.2 Implement a selector/utility that combines `calculatePeriodWindow`, log sums, and `derivePeriodStatus`, parameterized by timezone.
  - [x] 2.3 Ensure numeric formatting uses `Intl.NumberFormat` and unit-aware strings from `formatStandardSummary`.
  - [x] 2.4 Expose memoized progress data to the dashboard screen (React Query/Zustand selector) with loading/error states.
  - [x] 2.5 Run only the tests from 2.1.

**Acceptance Criteria:**
- Each standard exposes `periodLabel`, `currentTotal`, `target`, `status`, and `progressPercent`.
- Status values always map to existing color tokens (Met/In Progress/Missed).
- Timezone changes refresh labels without requiring an app restart.

### React Native UI Implementation

#### Task Group 3: Dashboard screen + card layout  
**Dependencies:** Task Groups 1-2

- [x] 3.0 Build the Active Standards list UI
  - [x] 3.1 Write 4 React Native Testing Library cases (loading skeleton, empty state, pinned ordering, log tap navigation).
  - [x] 3.2 Implement screen shell with header, `FlatList`/FlashList virtualization, and safe-area padding.
  - [x] 3.3 Create the two-line card component with status pill, progress numbers, and 4px progress bar; enforce line clamps.
  - [x] 3.4 Add `Log` CTA wired to the existing logging modal navigation (pass `standardId`, track success callback).
  - [x] 3.5 Provide pin affordance (long-press drag handle or context menu) updating the persistence helpers.
  - [x] 3.6 Run only the tests from 3.1.

**Acceptance Criteria:**
- Cards match the two-line layout with horizontal progress indicator and status pill.
- List honors pin order and falls back to recency when no pins exist.
- Tapping Log opens the fast logging modal preloaded with the selected standard.

#### Task Group 4: States, accessibility, and theming  
**Dependencies:** Task Group 3

- [x] 4.0 Polish UX and accessibility
  - [x] 4.1 Write 2 focused tests for empty-state CTA routing and error retry callback.
  - [x] 4.2 Implement shimmer/skeleton placeholders for loading (minimum three card placeholders).
  - [x] 4.3 Add empty-state messaging (“No active standards yet”) with a button to launch Standards Builder.
  - [x] 4.4 Surface inline error banner with retry when the hook reports an error; ensure retry re-subscribes.
  - [x] 4.5 Audit accessibility: `accessibilityLabel` strings for cards/log buttons/pin handles, WCAG-compliant colors, dark-mode styling via theme tokens.
  - [x] 4.6 Emit confirmation toast/snackbar after successful logging events.
  - [x] 4.7 Run only the tests from 4.1.

**Acceptance Criteria:**
- Loading, empty, and error states mirror spec copy and behavior.
- Screen usable via VoiceOver/TalkBack with descriptive labels.
- Progress visuals meet contrast requirements in both light and dark themes.

### Analytics & Observability

#### Task Group 5: Instrumentation and event wiring  
**Dependencies:** Task Group 3

- [x] 5.0 Track key dashboard interactions
  - [x] 5.1 Write 2 focused tests (or mocked assertions) ensuring analytics helpers are invoked on Log tap and pin reorder.
  - [x] 5.2 Extend `apps/mobile/src/utils/analytics.ts` with `dashboard_log_tap`, `dashboard_pin_standard`, and `dashboard_unpin_standard` events.
  - [x] 5.3 Fire analytics within the screen (include `standardId`, `activityId`, `pinned` boolean) and ensure failures fail silently.
  - [x] 5.4 Document the new events for the analytics team (e.g., inline comments or README note).
  - [x] 5.5 Run only the tests from 5.1.

**Acceptance Criteria:**
- All primary interactions emit analytics with consistent payload shapes.
- No crashes occur if analytics initialization fails or the user is offline.

### Feature QA & Gap Testing

#### Task Group 6: Integrated workflow validation  
**Dependencies:** Task Groups 1-5

- [x] 6.0 Validate end-to-end scenarios
  - [x] 6.1 Review tests from groups 1-5 and list remaining gaps (pin persistence, progress calc, logging flow, error state).
  - [x] 6.2 Add up to 6 additional integration tests (Detox/Jest) covering: logging from pinned/unpinned standards, pin reorder persistence, and status color regressions.
  - [x] 6.3 Run only the feature-specific suites (tests from 1.1, 2.1, 3.1, 4.1, 5.1, 6.2) and record results.
  - [x] 6.4 File/flag any blocking defects before handing off for review.

**Acceptance Criteria:**
- Feature-specific tests pass (approx. 19 executions total).
- Pinning, ordering, progress display, and logging workflows behave correctly on device/emulator.
- Documented gaps (if any) have follow-up tickets.

## Execution Order
1. Firestore & Hook Foundations (Task Groups 1-2)
2. React Native UI Implementation (Task Groups 3-4)
3. Analytics & Observability (Task Group 5)
4. Feature QA & Gap Testing (Task Group 6)
