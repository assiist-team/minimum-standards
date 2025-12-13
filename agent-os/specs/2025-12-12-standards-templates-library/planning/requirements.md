# Spec Requirements: Standards Library

## Initial Description

Standards Templates Library (local-only) — Implement local-only Standards templates: activate a template in one tap, create from scratch, and "save as template" when creating/editing a Standard (no sharing/import in MVP). `[M]`

**Note:** After clarification, this feature is actually a **Standards Library** (not a separate templates system). All Standards are automatically included in the library. There is no separate "template" concept.

## Requirements Discussion

### First Round Questions

**Q1:** Template Structure - I'm assuming a template stores: Activity reference (activityId), cadence (interval + unit), minimum, and unit. Should templates also have a user-provided name/label (e.g., "Weekly Sales Calls") to help identify them, or should we derive the name from the summary string (e.g., "1000 calls / week")?

**Answer:** No need to have a user provided name or label, just derive the name from the summary string. It could just actually just make it the summary string.

**Q2:** Activation Flow - When a user "activates a template in one tap," I'm assuming this creates a new Standard from the template (with a new ID) and immediately makes it active. Should activation open the Standards Builder pre-filled with the template values (allowing edits before saving), or should it create the Standard immediately without confirmation?

**Answer:** If we're activating an existing standard, there's no need to create a new one. It should just activate the standard. It should just change the whatever flag we're using so that it goes into the active screen. When activating, it immediately unarchives it and makes it active. We should have a similar archive button that does the opposite.

**Q3:** Create Template from Scratch - For "create from scratch," should this follow a similar two-step flow as the Standards Builder (pick/create Activity → set cadence + minimum + unit), or should it be a simplified single-screen form? Also, where should this be accessible from (standalone screen, entry point in Standards Builder, or both)?

**Answer:** I don't care about creating a template from scratch. When we create a standard, we should just save it in our standard library. Unless previously we talked about explicitly saving only certain standards. I'm fine with that if we've talked about that already and it's already built. But I don't care about creating them from scratch. Like we should just create a normal standard, and then save it as a template if we want. If that's the behavior, if the behavior is to automatically save all standards in the standard library, then we should just do that. We don't need some special template creation thing. Option A: automatically include all standards in the library. But no dupes. We shouldn't have duplicate standards.

**Q4:** "Save as Template" Integration - When creating/editing a Standard, should "save as template" appear as a checkbox/toggle during the save flow, or as a separate action after the Standard is saved? Should users be prompted to name the template when saving, or should we auto-generate a name from the summary?

**Answer:** All standards are automatically included in the library. No explicit "save as template" action needed.

**Q5:** Storage & Data Model - Since this is "local-only," I'm assuming templates are stored in Firestore under `/users/{uid}/standardTemplates` (similar to Activities). Should templates reference Activities by activityId, or should we store a copy of the Activity data? Also, should templates support soft-delete (deletedAtMs) like Standards and Activities?

**Answer:** I also don't think this should be local only. I don't know why the suggestion is to make this local. And yes, we should be referencing activities by activity ID. There seems to be a confusion about how this works. We shouldn't have three objects: templates, standards, and activities. We should only have standards and activities. The standards library, is just for standards. It's not for a separate template object.

**Q6:** UI Presentation - Should the Templates Library follow a similar pattern to the Activity Library (standalone screen with search, list view, create/edit/delete)? Should it also be accessible as a modal/sheet from the Standards Builder (similar to how Activity Library works)?

**Answer:** The standards library is just like the activity library, basically. It's accessible as a standalone screen. Users can access the standards library from app navigation.

**Q7:** Template Management - Should users be able to edit and delete templates in MVP? If editing, should changes affect existing Standards created from that template, or only future activations?

**Answer:** Not applicable - there are no separate templates. Standards are just Standards.

**Q8:** Scope Boundaries - Beyond "no sharing/import in MVP," are there any other features we should explicitly exclude? For example, should templates support categories/tags, usage counts, or preview of what the Standard would look like before activation?

**Answer:** Not applicable - simplified to just Standards Library.

### Follow-up Clarifications

**Q1:** Standards Library screen - Should this be a standalone screen (like Activity Library) accessible from navigation, or only accessible from the Standards Builder when creating a new standard?

**Answer:** The standards library is just like the activity library, basically. It's accessible as a standalone screen. Users can access the standards library from app navigation.

**Q2:** "Activate in one tap" - When activating an archived standard, should it immediately unarchive it and make it active (one tap, no confirmation), or should it open the Standards Builder pre-filled with that standard's values (allowing edits before saving as a new standard)?

**Answer:** If we activate it, it immediately unarchives it and makes it active. And we should have a similar archive button that does the opposite.

**Q3:** Creating from existing standard - When creating a new standard and selecting an existing one to pre-fill, should this always create a NEW standard (new ID), even if values are unchanged, or should unchanged values just activate/unarchive the existing standard?

**Answer:** When creating a new standard and selecting an existing one to pre-fill, this should create a new standard, but if nothing has changed, when we save, it should not create a new standard. It should just activate the existing standard.

**Q4:** Library organization - For the Active/Archived sections, should they be separate list sections on the same screen, or tabs/filters to switch between Active and Archived views? Should there be search functionality across all standards?

**Answer:** For active/archived, I think separate list sections on the same screen. And yes, search functionality across all standards. Actually, let's make two tabs, one for active, one for archived. I'm not sure how we should create the search functionality. Maybe search is just across all standards, even though we have those tabs.

**Q5:** Entry points - Where should users access the Standards Library? From app navigation (standalone screen)? From Standards Builder (when creating new standard)? Both?

**Answer:** Users can access the standards library from app navigation.

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Activity Library - Path: `apps/mobile/src/screens/ActivityLibraryScreen.tsx`
- Components to potentially reuse: 
  - Search input with debounced filtering
  - List view with FlatList
  - Create/Edit modal pattern (ActivityModal)
  - Navigation pattern from HomeScreen/App.tsx
- Backend logic to reference: 
  - `useActivities` hook pattern for data fetching
  - Firestore collection structure (`/users/{uid}/activities`)
  - Search filtering logic (case-insensitive name matching)

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
No visual assets provided.

## Requirements Summary

### Functional Requirements

**Core Functionality:**
- Standards Library is a standalone screen accessible from app navigation (similar to Activity Library)
- All Standards are automatically included in the library (no separate template concept)
- Library shows all Standards organized into two tabs: Active and Archived
- Search functionality works across all Standards regardless of which tab is active
- Search filters by Standard summary/name (case-insensitive, substring matching)

**Activation/Archive:**
- One-tap activation: Immediately unarchive an archived Standard and make it active (no confirmation)
- Archive button: Archive an active Standard (opposite of activation)
- No duplicate Standards allowed in the library

**Creating Standards from Existing:**
- When creating a new Standard, users can select an existing Standard to pre-fill the form
- Pre-fills: Activity, cadence, minimum, and unit
- If user changes any values before saving: Creates a new Standard
- If user doesn't change anything before saving: Activates the existing Standard (doesn't create duplicate)

**Data Model:**
- Standards are stored in Firestore (not local-only)
- Standards reference Activities by activityId
- Standards use existing Standard schema with `archivedAtMs` field for archive status
- No separate "template" object or collection

### Reusability Opportunities

- **UI Components:**
  - Reuse Activity Library screen pattern (`ActivityLibraryScreen.tsx`)
  - Reuse search input and filtering logic
  - Reuse tab navigation pattern (if using tabs)
  - Reuse list rendering with FlatList

- **Backend Patterns:**
  - Follow `useActivities` hook pattern for `useStandards` hook
  - Use Firestore collection structure: `/users/{uid}/standards`
  - Implement search filtering similar to Activity Library (client-side, debounced)

- **Navigation:**
  - Add Standards Library entry point to HomeScreen navigation (similar to Activity Library button)
  - Follow same navigation pattern as Activity Library

### Scope Boundaries

**In Scope:**
- Standalone Standards Library screen accessible from app navigation
- Two tabs: Active and Archived
- Search functionality across all Standards
- One-tap activation (unarchive) for archived Standards
- Archive button for active Standards
- Pre-fill Standards Builder with existing Standard values
- Smart duplicate prevention (activate existing if unchanged, create new if changed)
- All Standards automatically included (no explicit "save as template" action)
- Firestore storage (per-user scoped)

**Out of Scope:**
- Separate "template" object or concept
- Local-only storage
- Sharing/import functionality (per roadmap note)
- Creating templates from scratch (just create Standards normally)
- Explicit "save as template" action (all Standards are automatically in library)
- Categories/tags for Standards
- Usage counts or preview functionality
- Template editing (Standards are edited through normal Standard editing flow)

### Technical Considerations

- **Data Model:** 
  - Use existing Standard schema and Firestore collection (`/users/{uid}/standards`)
  - Archive status managed via `archivedAtMs` field (null = active, timestamp = archived)
  - Reference Activities by `activityId` (no duplication of Activity data)

- **UI Components:**
  - Model after `ActivityLibraryScreen.tsx` structure
  - Implement tab navigation for Active/Archived views
  - Reuse search input pattern with debounced filtering
  - Reuse list rendering patterns

- **Integration Points:**
  - Standards Builder: Allow selecting existing Standard to pre-fill form
  - Standards Builder: Detect if form values match existing Standard and activate instead of creating duplicate
  - HomeScreen: Add navigation entry point for Standards Library

- **Search Implementation:**
  - Client-side filtering (similar to Activity Library)
  - Search across all Standards regardless of active tab
  - Case-insensitive substring matching on summary/name
  - Debounced input (~300ms)

- **Duplicate Prevention:**
  - When saving from Standards Builder, check if values match existing Standard
  - Match criteria: Same activityId, cadence, minimum, and unit
  - If match found: Activate existing Standard instead of creating new one
