# Spec Requirements: Fast Logging (per-standard + global)

## Initial Description

Fast logging (per-standard + global) — Implement the Log screen supporting both entry points (from a Standard and global), with a big numeric input, explicit save, optional collapsed note, "When?" backdating control, and immediate UI updates after save. `[M]`

## Requirements Discussion

### First Round Questions

**Q1:** For the global logging entry point (when no standard is pre-selected), I'm assuming users should first select a Standard from their active standards (via search or a picker). Is that correct, or should we show a different selection UI (e.g., recent standards first, then search)?

**Answer:** Select a standard from their active standards. From a picker is fine. We don't need search for that.

**Q2:** For the "When?" backdating control, I'm thinking a date/time picker that defaults to "now" but allows selecting past dates/times. Should this be: A collapsible section like the note field (collapsed by default, expand to pick date/time)? Always visible with a "Now" button to reset to current time? Or a different approach?

**Answer:** Collapsible section for date/time picker probably makes sense. It can be a modal, whatever works best.

**Q3:** The roadmap mentions supporting logging "0". I'm assuming we should allow `value: 0` as a valid log entry (e.g., "I did 0 calls today"). Is that correct, or should there be any restrictions?

**Answer:** Allow zero values.

**Q4:** After successfully saving a log entry, should the modal: Close immediately and return to the previous screen? Stay open with a "Log another" button to log again (same or different standard)? Or offer both options (close button + "Log another")?

**Answer:** Close immediately and return to the previous screen. If the screen is the Active Standards Dashboard and a user's progress towards them, that progress should immediately be updated.

**Q5:** Where should users access the global logging entry point? Should it be: A button on the home screen? A floating action button (FAB) on the Active Standards Dashboard? Accessible from multiple places? Or something else?

**Answer:** The global logging entry point should be a button on the home screen. (Note: User mentioned they thought home screen was going to be the active standards dashboard, but home screen is actually the separate HomeScreen component with navigation buttons.)

**Q6:** I see there's already a `LogEntryModal` component (`apps/mobile/src/components/LogEntryModal.tsx`) that handles per-standard logging with numeric input, optional note, and explicit save. Should we extend this component to support both entry points (with optional standard prop), or create a separate screen/component for global logging?

**Answer:** We should definitely reuse the existing modal. Let's extend it.

**Q7:** For the "When?" backdating control, are there any preferences for date/time picker libraries, or should we use React Native's built-in `DatePickerIOS` / `@react-native-community/datetimepicker`?

**Answer:** I'm fine with using React Native's built-in date picker.

**Q8:** Are there any features or behaviors we should explicitly exclude from this feature? For example, should we exclude future-dating (only allow past/current dates), or any other constraints?

**Answer:** No features or behaviors are explicitly excluded.

### Existing Code to Reference

**Similar Features Identified:**
- Component: `LogEntryModal` - Path: `apps/mobile/src/components/LogEntryModal.tsx`
- This component already handles per-standard logging with:
  - Big numeric input (centered, large font)
  - Optional collapsed note field
  - Explicit save button
  - Modal presentation
- Should be extended to support:
  - Optional `standard` prop (when null, show standard picker first)
  - "When?" backdating control (collapsible date/time picker)

No other similar existing features identified for reference.

### Follow-up Questions

No follow-up questions were needed.

## Visual Assets

### Files Provided:
No visual files found.

### Visual Insights:
No visual assets provided.

## Requirements Summary

### Functional Requirements
- Extend existing `LogEntryModal` component to support both per-standard and global entry points
- When `standard` prop is provided: Use existing behavior (pre-selected standard)
- When `standard` prop is null/undefined: Show standard picker first, then proceed to logging form
- Standard picker should show active standards only (no search needed, simple picker UI)
- Add "When?" backdating control as collapsible section (collapsed by default)
- Date/time picker should default to current time ("now")
- Allow users to select past dates/times for backdating log entries
- Date/time picker can be implemented as modal or inline (whatever works best)
- Support logging zero values (`value: 0` is valid)
- After successful save: Close modal immediately and return to previous screen
- If logging from Active Standards Dashboard: Progress should update immediately (Firestore listeners will handle this)
- Add button on HomeScreen to access global logging entry point
- Maintain existing big numeric input, explicit save, and optional collapsed note functionality

### Reusability Opportunities
- Extend `LogEntryModal` component (`apps/mobile/src/components/LogEntryModal.tsx`) to support optional standard prop
- Reuse existing form patterns (numeric input, note field, save button)
- Reuse existing modal presentation pattern
- Reference `ActivityModal` component for collapsible field patterns if needed
- Use React Native's built-in date picker (`DatePickerIOS` / `@react-native-community/datetimepicker`)

### Scope Boundaries
**In Scope:**
- Extending `LogEntryModal` to support global entry point (standard picker when no standard provided)
- Adding "When?" backdating control with date/time picker (collapsible section)
- Supporting zero values in log entries
- Adding global logging button to HomeScreen
- Immediate UI updates after save (via existing Firestore listeners)
- Standard picker showing active standards only

**Out of Scope:**
- Search functionality for standard picker (not needed)
- "Log another" flow after save (close immediately instead)
- Future-dating restrictions (no explicit exclusions)
- Separate screen/component for global logging (extend existing modal)

### Technical Considerations
- Extend existing `LogEntryModal` component rather than creating new component
- Use React Native's built-in date picker components
- Standard picker should query active standards (non-archived)
- Date/time picker should be collapsible (collapsed by default, expand to show picker)
- Date/time picker can be modal or inline implementation
- Maintain existing validation patterns (allow zero values)
- Firestore listeners already handle immediate UI updates (no additional work needed)
- Add navigation entry point on HomeScreen component
- Follow existing modal patterns from `ActivityModal` for collapsible sections
