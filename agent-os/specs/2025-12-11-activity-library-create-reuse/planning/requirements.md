# Spec Requirements: Activity Library (create + reuse)

## Initial Description

Activity Library (create + reuse) — Build the Activity Library UI with search, create, and "recently used" Activities so users can reuse consistent Activities across Standards.

## Requirements Discussion

### First Round Questions

**Q1:** UI Presentation - The conceptual design shows this is accessed from the Standards Builder (step 1: Pick/create Activity). Should this appear as a modal/sheet that overlays the builder, or as a full-screen navigation push? I'm assuming a modal/sheet for quick selection—is that correct?

**Answer:** Most of the time people interact with the library through the process of creating a new standard (the first step of which is to create or select an activity). But there is also a way that people can go into the activity library as a standalone screen and make edits to the activities in that library. There are a couple of different entry points into it.

**Q2:** Search Functionality - The design specifies "Search + create". Should search be real-time (debounced ~300ms) filtering Activities by name (case-insensitive), or should we also search by unit? I'm assuming name-only for MVP—is that correct?

**Answer:** Searching only by name is fine for now.

**Q3:** Recently Used Logic - The design mentions "Shows recently used Activities". I'm assuming "recently used" means Activities referenced by Standards created/updated in the last 30 days, ordered by most recent Standard update. Should we show a fixed count (e.g., top 5-10) or all recent Activities? Also, should this section only appear when there are recent Activities, or always show (empty state if none)?

**Answer:** I don't remember what the context was around showing recently used activities. I don't remember that. I don't know what screen we're talking about when you're asking that question. I don't think we need a recently used section.

**Q4:** Create Flow - The conceptual design shows "Add Activity" as part of the UX. Should creating a new Activity: open an inline form/modal within the library view, or navigate to a separate create screen? After creation, should it automatically select the new Activity and return to the builder, or stay in the library for further selection?

**Answer:** I imagine that clicking add activity opens a modal that can be used across screens, whether someone is in the actual activity library screen, or if they're in the view that is associated with creating a new standard (the first step of which is to select or create an activity). Wherever it is, we can use that same modal. If the context is the user is creating a new standard, then a newly created activity in that context should automatically be selected.

**Q5:** Activity Fields - Based on the data model, creating an Activity requires: name (max 120 chars) and unit (max 40 chars). For the unit field, should we provide suggestions/autocomplete based on existing Activities, or is free text sufficient for MVP? The conceptual design mentions "free text, later: suggestions"—should MVP be free text only?

**Answer:** For the unit field, free text is fine. But we should think about the singular versus plural situation there. Maybe it doesn't matter. Like if the user types in "call" as the unit, it'll be weird to say "I logged 20 call." We should say "I log 20 calls." I don't know how to problem solve for that to make sure we're not in that weird situation.

**Q6:** Layout & Organization - Should the library view show: Search bar at top, "Recently Used" section (if any exist), Search results below (or "All Activities" when search is empty), "Create New Activity" button always visible (top/bottom/fab)? Or a different organization?

**Answer:** In terms of where the search bar should appear, it should probably appear at the top of the Activity Library screen. And then if someone in the Standard Creation Wizard chooses to select an existing Activity, it would be great if they could search the list in addition to scrolling the list. I don't think we need a recently used section. I don't know what you mean by asking if the library should show search results below. I find that confusing. I don't know what you're referring to there. And I think I answered—I think I addressed the last bullet under number six already.

**Q7:** Empty States - When a user has no Activities yet, should we: show an empty state with prominent "Create Your First Activity" CTA, or auto-focus/show the create form immediately?

**Answer:** We don't need any special text for empty states.

**Q8:** Selection Behavior - When a user selects an existing Activity from the library, should it: immediately return to the Standards Builder with that Activity selected, or show a confirmation/next step before proceeding?

**Answer:** When selecting an activity we can immediately return.

**Q9:** Scope Boundaries - For MVP, should we exclude editing/deleting Activities from the library (only create + select), or include basic edit/delete actions? Also, should we show which Standards use each Activity (usage count), or keep that out of scope for MVP?

**Answer:** For the MVP, I have already said this, we should include editing and deleting activities. We don't need to show which standards use each activity.

### Existing Code to Reference

**Similar Features Identified:**
No similar existing features identified for reference.

### Follow-up Questions

**Follow-up 1:** You mentioned the singular/plural issue for units (e.g., "20 call" vs "20 calls"). How should we handle this? Options: 1) Always store and display plural form — Users enter "calls", "pages", "minutes" (plural), and we always display it as-is (e.g., "20 calls", "1 calls"). 2) Store as-is, display with simple pluralization logic — Users can enter "call" or "calls", and we automatically pluralize when displaying (e.g., "1 call", "20 calls"). 3) Store as-is, display as-is — Accept that "1 call" or "20 calls" might appear, depending on what the user entered. Which approach should we use for MVP?

**Answer:** Store plural form and display with auto pluralization. Normalize user input (singular or plural) to plural form on save. Use pluralize library to automatically display correct form based on count (e.g., "1 call" for count of 1, "20 calls" for count of 20).

**Follow-up 2:** Should we keep Activity `inputType` (number vs yes/no), or simplify Activities to always be numeric inputs?

**Answer:** Remove binary activities and remove `inputType` altogether; it doesn’t seem needed.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
No visual assets provided.

## Requirements Summary

### Functional Requirements
- **Multiple Entry Points**: Activity Library accessible both as a standalone screen (for editing/deleting activities) and from the Standards Builder flow (step 1: pick/create Activity)
- **Search Functionality**: Real-time search (name-only, case-insensitive) available in both contexts
  - Search bar at top of Activity Library screen
  - Search capability in Standard Creation Wizard when selecting existing Activity (in addition to scrolling)
- **Create Activity Modal**: Reusable modal for creating activities that can be used from:
  - Standalone Activity Library screen
  - Standards Builder flow (step 1)
  - After creation in Standards Builder context: automatically select the new Activity and return to builder
- **Edit/Delete Activities**: Include editing and deleting activities in MVP (accessible from standalone Activity Library screen)
- **Activity Fields**: 
  - Name (max 120 chars)
  - Unit (max 40 chars, free text)
  - **Unit normalization**: Accept singular or plural input, normalize to plural form on save
  - **Unit display**: Use pluralize library to auto-pluralize based on count (e.g., "1 call" vs "20 calls")
- **Selection Behavior**: When selecting an existing Activity, immediately return to Standards Builder with that Activity selected
- **No Recently Used Section**: Do not include a "recently used" section
- **No Usage Count**: Do not show which Standards use each Activity

### Reusability Opportunities
- No similar existing features identified for reference

### Scope Boundaries
**In Scope:**
- Standalone Activity Library screen with search, create, edit, delete
- Activity Library integration in Standards Builder (step 1: pick/create Activity)
- Reusable "Add Activity" modal
- Search by name (case-insensitive)
- Edit and delete activities
- Automatic selection of newly created Activity when in Standards Builder context

**Out of Scope:**
- Recently used Activities section
- Showing which Standards use each Activity
- Search by unit
- Unit suggestions/autocomplete
- Special empty state messaging
- Recently used section

### Technical Considerations
- **UI Components**: Reusable modal for creating activities across different contexts
- **Navigation**: Activity Library accessible as both standalone screen and integrated into Standards Builder flow
- **Search Implementation**: Real-time search (likely debounced) filtering by Activity name
- **Data Model**: Activities have name and unit fields (already defined in shared-model)
- **Singular/Plural Handling**: 
  - Store units in plural form (normalize on save: accept "call" or "calls", store as "calls")
  - Use `pluralize` npm library (~2KB) for display logic
  - Display: `pluralize(unit, count)` automatically handles "1 call" vs "20 calls"
  - Benefits: Consistent storage, handles edge cases, minimal bundle impact
- **Integration Points**: 
  - Standards Builder (step 1: pick/create Activity)
  - Standalone Activity Library screen (for management)
- **User Scoping**: Activities are user-scoped (from core data model spec)
