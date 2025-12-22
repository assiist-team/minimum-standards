# Task 05 · Remove Standard Detail Navigation

## Goal
Make taps on standard cards a no-op (per the plan’s “Standard taps” decision), effectively deprecating the old Standards History surface and preventing navigation to `StandardDetailScreen`.

## Deliverables
- Updated handlers in every place that currently navigates to `StandardDetailScreen` (e.g., `onNavigateToDetail`, `onSelectStandard`) so taps no longer push a screen.
- Ensure edit/deactivate actions remain accessible (buttons or menus still work).
- Remove unused Standard Detail route/screens if nothing else depends on them, or clearly comment that they are legacy-only (optional clean-up).

## Key Requirements
- Expected locations called out in plan: Active dashboard wrapper and Standards Library wrapper.
- Verify there are no hidden code paths (search for `StandardDetail` navigation).
- Maintain UX consistency: card tap might still provide ripple / selection state, but must not navigate.
- Ensure tests referencing Standard Detail navigation are updated/removed.

## Implementation Steps
1. **Audit Navigation Calls**
   - Search for `navigate('StandardDetail'` or similar helpers.
   - Document each entry point and confirm it should become a no-op.
2. **Update Handlers**
   - Replace navigation calls with either an empty function or, better, an inline comment clarifying “no navigation per Activity History plan”.
   - If there is user feedback (e.g., toast) expected, confirm with product; default is silent no-op.
3. **Clean Up Routes (optional)**
   - If `StandardDetailScreen` isn’t used elsewhere, remove it from the navigator and delete related files/tests.
   - If it must remain for builder/admin flows, ensure consumer paths are clearly separated.
4. **Testing**
   - Manual: tapping standards on dashboard and library cards should do nothing while edit/deactivate buttons still function.
   - Automated: update any navigation tests to expect no navigation (e.g., ensure `navigate` mock not called).

## Testing / Acceptance
- Regression pass on dashboard + standards library interactions.
- Confirm Activity History remains discoverable via Task 04 button.

