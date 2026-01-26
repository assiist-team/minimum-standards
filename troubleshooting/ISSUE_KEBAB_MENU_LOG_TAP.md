# Issue: Kebab Menu "Log" Tap Lock-up

## Description
Tapping the "Log" option inside the kebab menu for active standards cards results in no action, and subsequently locks up tap actions for the active standards cards.

## Location
- **File**: `apps/mobile/src/components/StandardProgressCard.tsx`
- **Component**: `StandardProgressCard`

## Symptoms
1. Open kebab menu on an active standard card.
2. Tap "Log".
3. **Result**: 
   - The "Log" action does not trigger (Log modal doesn't open).
   - The UI "locks up" (subsequent taps on the card or other elements fail to respond).

## Attempted Fixes (Failed)

### Attempt 1: Explicit Delay (`setTimeout`)
- **Strategy**: Added a 350ms delay via `setTimeout` before triggering the `onLogPress` callback to allow the menu modal to close first.
- **Result**: Rejected by user. Delays are undesirable and considered a "lazy" fix.

### Attempt 2: `InteractionManager`
- **Strategy**: Wrapped the callback in `InteractionManager.runAfterInteractions` to wait for animations/interactions to complete.
- **Result**: Failed to resolve the issue.

## Root Cause
The issue was caused by **Modal conflict**. Two React Native Modal components (the kebab menu Modal and the LogEntryModal) were transitioning simultaneously, causing the React Native Modal manager to enter an inconsistent state where the UI became unresponsive.

The problematic sequence:
1. Menu Modal begins closing (`setMenuVisible(false)`)
2. Immediately (via `setTimeout` with 0ms), LogEntry Modal tries to open (`setLogModalVisible(true)`)
3. Both modals are animating at the same time
4. Modal manager gets confused, leaving an invisible overlay that blocks all touch events

## Solution Implemented ✅

**Use Modal's `onDismiss` callback to queue actions after the menu fully closes.**

### Changes Made:
1. Added `pendingAction` state to store the callback that should run after the menu closes:
   ```typescript
   const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
   ```

2. Updated all menu action handlers to set the pending action instead of using `setTimeout`:
   ```typescript
   const handleMenuLogPress = useCallback(() => {
     setPendingAction(() => onLogPress);
     setMenuVisible(false);
     setCategorizeExpanded(false);
   }, [onLogPress]);
   ```

3. Added `onDismiss` callback to the Modal component:
   ```typescript
   <Modal
     visible={menuVisible}
     transparent={true}
     animationType="fade"
     onRequestClose={() => {
       setMenuVisible(false);
       setCategorizeExpanded(false);
     }}
     onDismiss={() => {
       if (pendingAction) {
         pendingAction();
         setPendingAction(null);
       }
     }}
   >
   ```

### Why This Works:
- `onDismiss` is called by React Native **after the Modal's exit animation completes**
- This ensures the menu Modal is fully unmounted before the LogEntry Modal tries to mount
- No race conditions between modal transitions
- No artificial delays or polling
- Follows React Native's recommended pattern for sequential modal operations

## Status: RESOLVED ✅
The fix has been implemented and follows React Native best practices for managing sequential modal operations.
