# Task 06 · Update UI Copy to “Deactivate/Inactive”

## Goal
Replace visible “Archive/Archived” wording with “Deactivate/Inactive” wherever safe in the UI, aligning with the plan’s short-term language shift while leaving the underlying schema untouched.

## Deliverables
- Copy updates across screens/components that mention archive states (dashboard cards, menus, modals, toasts, etc.).
- Ensure no data model changes (`archivedAtMs`, API method names) occur in this task.
- Document any surfaces that still use “archive” because of technical coupling (for future rename work).

## Key Requirements
- Only user-facing text changes; keep field names and analytics event names unless product explicitly approves renames.
- Prefer “Deactivate” as the verb (buttons) and “Inactive” as the adjective (status labels).
- Update localization files if the app supports multiple locales; coordinate with translation workflow.
- Avoid regressions in accessibility (announce strings updated).

## Implementation Steps
1. **Audit Strings**
   - Search for “Archive”/“Archived” in the mobile app and shared strings.
   - List each surface and decide on the correct replacement (“Deactivate”/“Inactive”).
2. **Apply Copy Changes**
   - Update string constants or translation keys.
   - If any string doubles as an identifier (e.g., analytics event), leave as-is and add TODO referencing future rename spec.
3. **Verify UX**
   - Ensure action flows still make sense (e.g., “Deactivate standard” confirmation modal copy).
4. **Documentation**
   - Update any README or spec snippet referenced by developers so naming stays consistent.

## Testing / Acceptance
- Manual spot-check of key surfaces (dashboard cards, standards list, modals) to confirm new terminology.
- Regression on localization build to ensure keys exist.

